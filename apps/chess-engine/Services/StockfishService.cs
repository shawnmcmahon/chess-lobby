using System.Diagnostics;

namespace ChessEngine.Services;

public sealed class StockfishService : IDisposable
{
    private readonly string _stockfishPath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private Process? _process;
    private StreamWriter? _input;
    private StreamReader? _output;

    public StockfishService(IConfiguration configuration)
    {
        _stockfishPath =
            configuration["STOCKFISH_PATH"]
            ?? (OperatingSystem.IsWindows() ? "stockfish.exe" : "stockfish");
    }

    public async Task<string> GetBestMoveAsync(
        string fen,
        int skill = 10,
        int movetimeMs = 800,
        CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            await EnsureProcessAsync(cancellationToken);
            await SendAsync($"setoption name Skill Level value {Math.Clamp(skill, 0, 20)}", cancellationToken);
            await SendAsync($"position fen {fen}", cancellationToken);
            await SendAsync($"go movetime {Math.Clamp(movetimeMs, 100, 30000)}", cancellationToken);

            var bestMove = await ReadUntilBestMoveAsync(cancellationToken);
            if (string.IsNullOrEmpty(bestMove) || bestMove == "(none)")
            {
                throw new InvalidOperationException("Engine returned no move");
            }

            return bestMove;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task EnsureProcessAsync(CancellationToken cancellationToken)
    {
        if (_process is { HasExited: false })
        {
            return;
        }

        _process?.Dispose();

        var startInfo = new ProcessStartInfo
        {
            FileName = _stockfishPath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        _process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start Stockfish process");

        _input = _process.StandardInput;
        _output = _process.StandardOutput;

        await SendAsync("uci", cancellationToken);
        await ReadUntilAsync("uciok", cancellationToken);
        await SendAsync("isready", cancellationToken);
        await ReadUntilAsync("readyok", cancellationToken);
    }

    private async Task SendAsync(string command, CancellationToken cancellationToken)
    {
        if (_input is null)
        {
            throw new InvalidOperationException("Stockfish not initialized");
        }

        await _input.WriteLineAsync(command.AsMemory(), cancellationToken);
        await _input.FlushAsync(cancellationToken);
    }

    private async Task<string> ReadUntilBestMoveAsync(CancellationToken cancellationToken)
    {
        var bestMove = "";
        while (!cancellationToken.IsCancellationRequested)
        {
            var line = await ReadLineAsync(cancellationToken);
            if (line.StartsWith("bestmove ", StringComparison.Ordinal))
            {
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    bestMove = parts[1];
                }
                break;
            }
        }

        return bestMove;
    }

    private async Task ReadUntilAsync(string token, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var line = await ReadLineAsync(cancellationToken);
            if (line.Contains(token, StringComparison.Ordinal))
            {
                return;
            }
        }
    }

    private async Task<string> ReadLineAsync(CancellationToken cancellationToken)
    {
        if (_output is null)
        {
            throw new InvalidOperationException("Stockfish not initialized");
        }

        var line = await _output.ReadLineAsync(cancellationToken);
        return line ?? string.Empty;
    }

    public void Dispose()
    {
        try
        {
            if (_input is not null && _process is { HasExited: false })
            {
                _input.WriteLine("quit");
                _input.Flush();
            }
        }
        catch
        {
            // ignore shutdown errors
        }

        _process?.Dispose();
        _lock.Dispose();
    }
}

public record BestMoveRequest(string Fen, int? Skill, int? MovetimeMs);

public record BestMoveResponse(string BestMove);
