using Amazon.Lambda.AspNetCoreServer.Hosting;
using ChessEngine.Services;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);
builder.Services.AddSingleton<IChessEngine, StockfishService>();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 4096);

// Fail closed in Lambda and in ordinary HTTP hosting. Never ship this key to the SPA.
var apiKey = builder.Configuration["ENGINE_API_KEY"];
if (string.IsNullOrWhiteSpace(apiKey))
    throw new InvalidOperationException("ENGINE_API_KEY must be configured");
var expectedKey = SHA256.HashData(Encoding.UTF8.GetBytes(apiKey));
var app = builder.Build();

// Authenticate before JSON parsing or starting the native process. No browser CORS policy.
app.Use(async (http, next) =>
{
    if (http.Request.Path == "/health" && HttpMethods.IsGet(http.Request.Method))
    {
        await next(http);
        return;
    }
    var supplied = http.Request.Headers["X-Api-Key"];
    if (supplied.Count != 1 || supplied[0] is not { Length: <= 256 } key ||
        !CryptographicOperations.FixedTimeEquals(expectedKey, SHA256.HashData(Encoding.UTF8.GetBytes(key))))
    {
        http.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    await next(http);
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapPost("/api/best-move", async (HttpContext http, IChessEngine engine, ILogger<Program> logger) =>
{
    // Lambda's adapter does not use Kestrel's body limits, so enforce the same limit here.
    var bytes = new byte[4097];
    var length = 0;
    while (length < bytes.Length)
    {
        var read = await http.Request.Body.ReadAsync(bytes.AsMemory(length), http.RequestAborted);
        if (read == 0) break;
        length += read;
    }
    if (length > 4096) return Results.StatusCode(StatusCodes.Status413PayloadTooLarge);
    BestMoveRequest? request;
    try
    {
        request = JsonSerializer.Deserialize<BestMoveRequest>(bytes.AsSpan(0, length), new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }
    catch (JsonException)
    {
        return Results.BadRequest(new { error = "invalid JSON" });
    }
    if (request is null || !FenValidation.IsValid(request.Fen))
        return Results.BadRequest(new { error = "a valid six-field fen is required" });

    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(http.RequestAborted);
    timeout.CancelAfter(TimeSpan.FromSeconds(5));
    try
    {
        var move = await engine.GetBestMoveAsync(request.Fen!, request.Skill ?? 10, request.MovetimeMs ?? 800, timeout.Token);
        return Results.Ok(new BestMoveResponse(move));
    }
    catch (OperationCanceledException)
    {
        logger.LogWarning("Stockfish request timed out or was cancelled");
        return Results.Problem(title: "Engine request timed out", statusCode: 503);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Stockfish request failed");
        return Results.Problem(title: "Engine unavailable", statusCode: 503);
    }
});
app.Run();

public partial class Program;
