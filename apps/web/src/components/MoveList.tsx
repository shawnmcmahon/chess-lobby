import type { MoveEval } from "@/hooks/useStockfishAnalysis";

type MoveRow = {
  moveNumber: number;
  white?: string;
  black?: string;
  whiteEval?: MoveEval | null;
  blackEval?: MoveEval | null;
};

function formatEval(ev: MoveEval | null | undefined): string {
  if (!ev) return "—";
  if (ev.mate !== undefined) {
    return ev.mate > 0 ? `#${ev.mate}` : `#${ev.mate}`;
  }
  const pawns = ev.cp / 100;
  return pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

export function MoveList({
  rows,
  plyIndex,
  onSelectPly,
}: {
  rows: MoveRow[];
  plyIndex: number;
  onSelectPly: (ply: number) => void;
}) {
  return (
    <div className="max-h-[420px] overflow-y-auto rounded border border-stone-800">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-stone-900 text-stone-400">
          <tr>
            <th className="px-2 py-1 text-left">#</th>
            <th className="px-2 py-1 text-left">White</th>
            <th className="px-2 py-1 text-left">Black</th>
            <th className="px-2 py-1 text-right">Eval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.moveNumber} className="border-t border-stone-800/80">
              <td className="px-2 py-1 text-stone-500">{row.moveNumber}</td>
              <td className="px-2 py-1">
                <button
                  type="button"
                  onClick={() => onSelectPly(row.moveNumber * 2 - 1)}
                  className={`rounded px-1 hover:bg-stone-800 ${
                    plyIndex === row.moveNumber * 2 - 1
                      ? "bg-amber-950/50 text-amber-300"
                      : ""
                  }`}
                >
                  {row.white ?? "…"}
                </button>
              </td>
              <td className="px-2 py-1">
                {row.black ? (
                  <button
                    type="button"
                    onClick={() => onSelectPly(row.moveNumber * 2)}
                    className={`rounded px-1 hover:bg-stone-800 ${
                      plyIndex === row.moveNumber * 2
                        ? "bg-amber-950/50 text-amber-300"
                        : ""
                    }`}
                  >
                    {row.black}
                  </button>
                ) : (
                  "…"
                )}
              </td>
              <td className="px-2 py-1 text-right font-mono text-xs text-stone-400">
                {formatEval(row.blackEval ?? row.whiteEval)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { MoveRow };
