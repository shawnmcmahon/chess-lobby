using System.Text.RegularExpressions;

namespace ChessEngine.Services;

public static partial class FenValidation
{
    // Reject UCI command injection and unsafe/malformed boards before invoking native code.
    public static bool IsValid(string? fen)
    {
        if (fen is null || fen.Length > 128 || !FenPattern().IsMatch(fen)) return false;
        var fields = fen.Split(' ');
        var ranks = fields[0].Split('/');
        if (ranks.Length != 8) return false;
        var kings = new List<(char Piece, int Row, int Column)>();
        for (var row = 0; row < 8; row++)
        {
            var column = 0;
            foreach (var piece in ranks[row])
            {
                if (piece is >= '1' and <= '8') column += piece - '0';
                else
                {
                    if ((row == 0 || row == 7) && piece is 'p' or 'P') return false;
                    if (piece is 'k' or 'K') kings.Add((piece, row, column));
                    column++;
                }
            }
            if (column != 8) return false;
        }
        if (kings.Count != 2 || kings[0].Piece == kings[1].Piece) return false;
        if (Math.Abs(kings[0].Row - kings[1].Row) <= 1 && Math.Abs(kings[0].Column - kings[1].Column) <= 1) return false;
        return int.TryParse(fields[4], out _) && int.TryParse(fields[5], out var fullmove) && fullmove > 0;
    }

    [GeneratedRegex(@"\A[pnbrqkPNBRQK1-8/]+ [wb] (-|K?Q?k?q?) (-|[a-h][36]) [0-9]{1,9} [0-9]{1,9}\z")]
    private static partial Regex FenPattern();
}
