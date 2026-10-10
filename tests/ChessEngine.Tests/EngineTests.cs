using System.Net;
using System.Net.Http.Json;
using System.Text;
using ChessEngine.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

public class EngineTests
{
    private const string Fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    private const string Key = "tests-only-key-not-a-production-secret";

    [Theory]
    [InlineData(null)]
    [InlineData("wrong")]
    public async Task UnauthorizedRequestsDoNotParseOrStartEngine(string? key)
    {
        var fake = new FakeEngine();
        using var app = new EngineApp(fake);
        using var client = app.CreateClient();
        if (key != null) client.DefaultRequestHeaders.Add("X-Api-Key", key);
        var response = await client.PostAsync("/api/best-move", new StringContent("broken-json"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(0, fake.Calls);
    }

    [Fact]
    public async Task PreservesCamelCaseContractAndRequestedSettings()
    {
        var fake = new FakeEngine();
        using var app = new EngineApp(fake);
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);
        var response = await client.PostAsJsonAsync("/api/best-move", new { fen = Fen, skill = 20, movetimeMs = 800 });
        response.EnsureSuccessStatusCode();
        Assert.Equal("{\"bestMove\":\"e2e4\"}", await response.Content.ReadAsStringAsync());
        Assert.Equal((Fen, 20, 800), fake.LastRequest);
        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Theory]
    [InlineData("null")]
    [InlineData("{}")] 
    [InlineData("{")]
    [InlineData("{\"fen\":\"8/8/8/8/8/8/8/8 w - - 0 1\"}")]
    [InlineData("{\"fen\":\"4k3/8/8/8/8/8/8/4K3 w - - 0 1\\ngo infinite\"}")]
    public async Task MalformedInputDoesNotInvokeNativeEngine(string body)
    {
        var fake = new FakeEngine();
        using var app = new EngineApp(fake);
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);
        var response = await client.PostAsync("/api/best-move", new StringContent(body, Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, fake.Calls);
    }

    [Fact]
    public async Task OversizedBodyIsRejected()
    {
        using var app = new EngineApp(new FakeEngine());
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);
        var response = await client.PostAsync("/api/best-move", new StringContent(new string(' ', 4097)));
        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task ProcessFailureReturns503WithoutExposingDetails()
    {
        using var app = new EngineApp(new FakeEngine { Failure = new IOException("private process details") });
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);
        var response = await client.PostAsJsonAsync("/api/best-move", new { fen = Fen });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("private process details", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task TimeoutReturns503AndCancelsEngine()
    {
        var fake = new FakeEngine { WaitForCancellation = true };
        using var app = new EngineApp(fake);
        using var client = app.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", Key);
        var response = await client.PostAsJsonAsync("/api/best-move", new { fen = Fen });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.True(fake.WasCancelled);
    }

    [Fact]
    public void MissingKeyFailsClosedAtStartup()
    {
        using var app = new EngineApp(new FakeEngine(), "");
        var error = Assert.Throws<InvalidOperationException>(() => app.CreateClient());
        Assert.Contains("ENGINE_API_KEY must be configured", error.Message);
    }

    private sealed class EngineApp(FakeEngine engine, string key = Key) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseSetting("ENGINE_API_KEY", key);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IChessEngine>();
                services.AddSingleton<IChessEngine>(engine);
            });
        }
    }

    private sealed class FakeEngine : IChessEngine
    {
        public int Calls;
        public (string, int, int) LastRequest;
        public Exception? Failure;
        public bool WaitForCancellation;
        public bool WasCancelled;
        public async Task<string> GetBestMoveAsync(string fen, int skill, int movetimeMs, CancellationToken cancellationToken)
        {
            Calls++;
            LastRequest = (fen, skill, movetimeMs);
            if (Failure is not null) throw Failure;
            if (WaitForCancellation)
            {
                try { await Task.Delay(Timeout.Infinite, cancellationToken); }
                catch (OperationCanceledException) { WasCancelled = true; throw; }
            }
            return "e2e4";
        }
    }

    [LinuxFact]
    public async Task UciProcessIsBoundedAndRecoversAfterCancellationAndExit()
    {
        // Real subprocess fixture; Linux CI validates the deployment OS. API tests also run on Windows.
        if (!OperatingSystem.IsLinux()) return;
        var directory = Path.Combine(Path.GetTempPath(), "chess-engine-test-" + Guid.NewGuid());
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, "stockfish");
        await File.WriteAllTextAsync(path, """
            #!/bin/sh
            echo $$ >> "$0.pids"
            while IFS= read -r command; do
              echo "$command" >> "$0.commands"
              case "$command" in
                uci) echo uciok ;;
                isready) echo readyok ;;
                'position fen '*) position="$command" ;;
                'go movetime '*)
                  case "$position" in
                    *' 0 2') sleep 30 ;;
                    *' 0 3') exit 1 ;;
                    *) echo 'bestmove e2e4' ;;
                  esac ;;
              esac
            done
            """ + "\n");
        File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        try
        {
            using var engine = new StockfishService(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["STOCKFISH_PATH"] = path }).Build());
            Assert.Equal("e2e4", await engine.GetBestMoveAsync(Fen, 100, 30000));
            var commands = await File.ReadAllTextAsync(path + ".commands");
            Assert.Contains("go movetime 1500", commands);
            Assert.Contains("Skill Level value 20", commands);
            Assert.Contains("Threads value 1", commands);
            Assert.Contains("Hash value 32", commands);
            using var cancel = new CancellationTokenSource(200);
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => engine.GetBestMoveAsync(Fen[..^1] + "2", cancellationToken: cancel.Token));
            Assert.Equal("e2e4", await engine.GetBestMoveAsync(Fen));
            await Assert.ThrowsAsync<InvalidOperationException>(() => engine.GetBestMoveAsync(Fen[..^1] + "3"));
            Assert.Equal("e2e4", await engine.GetBestMoveAsync(Fen));
            Assert.Equal(3, File.ReadAllLines(path + ".pids").Length);
        }
        finally { Directory.Delete(directory, recursive: true); }
    }
}

public sealed class LinuxFactAttribute : FactAttribute
{
    public LinuxFactAttribute()
    {
        if (!OperatingSystem.IsLinux()) Skip = "Native Linux subprocess lifecycle is verified by Linux CI";
    }
}
