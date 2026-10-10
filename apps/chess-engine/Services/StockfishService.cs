using System.Diagnostics;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace ChessEngine.Services;

public interface IChessEngine
{
    Task<string> GetBestMoveAsync(string fen, int skill = 10, int movetimeMs = 800, CancellationToken cancellationToken = default);
}

public sealed partial class StockfishService(IConfiguration configuration, ILogger<StockfishService>? logger = null) : IChessEngine, IDisposable
{
    public const int MaxMovetimeMs = 1500;
    private readonly string _stockfishPath = configuration["STOCKFISH_PATH"] ?? (OperatingSystem.IsWindows() ? "stockfish.exe" : "stockfish");
    private readonly SemaphoreSlim _lock = new(1, 1);
    private Process? _process;

    public async Task<string> GetBestMoveAsync(string fen, int skill = 10, int movetimeMs = 800, CancellationToken cancellationToken = default)
    {
        if (!FenValidation.IsValid(fen)) throw new ArgumentException("Invalid FEN", nameof(fen));
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(15));
        await _lock.WaitAsync(timeout.Token);
        try
        {
            // Lambda lazily loads image pages; cold native initialization needs separate headroom.
            using (var initialization = CancellationTokenSource.CreateLinkedTokenSource(timeout.Token))
            {
                initialization.CancelAfter(TimeSpan.FromSeconds(12));
                await EnsureProcessAsync(initialization.Token);
            }
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            // Independent requests across Lambda freeze/thaw and different games.
            await SendAsync("ucinewgame", timeout.Token);
            await SendAsync($"setoption name Skill Level value {Math.Clamp(skill, 0, 20)}", timeout.Token);
            await SendAsync("isready", timeout.Token);
            await ReadUntilAsync("readyok", timeout.Token);
            await SendAsync($"position fen {fen}", timeout.Token);
            await SendAsync($"go movetime {Math.Clamp(movetimeMs, 100, MaxMovetimeMs)}", timeout.Token);
            while (true)
            {
                var line = await ReadLineAsync(timeout.Token);
                if (!line.StartsWith("bestmove ", StringComparison.Ordinal)) continue;
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2 || !UciMovePattern().IsMatch(parts[1])) throw new InvalidOperationException("Engine returned no legal move");
                return parts[1];
            }
        }
        catch
        {
            // Cancelled searches must not compute in the background or pollute the next result.
            ResetProcess();
            throw;
        }
        finally { _lock.Release(); }
    }

    private async Task EnsureProcessAsync(CancellationToken token)
    {
        if (_process is { HasExited: false }) return;
        ResetProcess();
        var startup = Stopwatch.StartNew();
        _process = Process.Start(new ProcessStartInfo
        {
            FileName = _stockfishPath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        }) ?? throw new InvalidOperationException("Failed to start Stockfish");
        _process.StandardInput.AutoFlush = true;
        _ = DrainErrorsAsync(_process.StandardError);
        await SendAsync("uci", token);
        await ReadUntilAsync("uciok", token);
        logger?.LogInformation("Stockfish UCI initialized in {ElapsedMs} ms", startup.ElapsedMilliseconds);
        await SendAsync("setoption name Threads value 1", token);
        await SendAsync("setoption name Hash value 32", token);
        await SendAsync("isready", token);
        await ReadUntilAsync("readyok", token);
        logger?.LogInformation("Stockfish ready in {ElapsedMs} ms", startup.ElapsedMilliseconds);
    }

    private async Task SendAsync(string command, CancellationToken token) =>
        await _process!.StandardInput.WriteLineAsync(command.AsMemory(), token);

    private async Task<string> ReadLineAsync(CancellationToken token) =>
        await _process!.StandardOutput.ReadLineAsync(token) ?? throw new InvalidOperationException("Stockfish exited unexpectedly");

    private async Task ReadUntilAsync(string expected, CancellationToken token)
    {
        while (await ReadLineAsync(token) != expected) { }
    }

    private static async Task DrainErrorsAsync(StreamReader reader)
    {
        try { while (await reader.ReadLineAsync() is not null) { } }
        catch (ObjectDisposedException) { }
        catch (IOException) { }
    }

    private void ResetProcess()
    {
        if (_process is null) return;
        try
        {
            if (!_process.HasExited) _process.Kill(entireProcessTree: true);
            _process.WaitForExit(1000);
        }
        finally { _process.Dispose(); _process = null; }
    }

    public void Dispose() { ResetProcess(); _lock.Dispose(); }

    [GeneratedRegex(@"\A[a-h][1-8][a-h][1-8][qrbn]?\z")]
    private static partial Regex UciMovePattern();
}

public record BestMoveRequest(string? Fen, int? Skill, int? MovetimeMs);
public record BestMoveResponse([property: JsonPropertyName("bestMove")] string BestMove);
