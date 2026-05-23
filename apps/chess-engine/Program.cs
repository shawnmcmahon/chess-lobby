using ChessEngine.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<StockfishService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapPost(
    "/api/best-move",
    async (BestMoveRequest request, StockfishService engine, HttpContext http, IConfiguration config) =>
    {
        var apiKey = config["ENGINE_API_KEY"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            if (!http.Request.Headers.TryGetValue("X-Api-Key", out var key) || key != apiKey)
            {
                return Results.Unauthorized();
            }
        }

        if (string.IsNullOrWhiteSpace(request.Fen))
        {
            return Results.BadRequest(new { error = "fen is required" });
        }

        try
        {
            var bestMove = await engine.GetBestMoveAsync(
                request.Fen,
                request.Skill ?? 10,
                request.MovetimeMs ?? 800);
            return Results.Ok(new BestMoveResponse(bestMove));
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, statusCode: 503);
        }
    });

app.Run();
