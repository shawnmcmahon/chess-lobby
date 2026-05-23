import type { MoveEval } from "@/hooks/useStockfishAnalysis";

export function EvalBar({ eval: ev }: { eval: MoveEval | null | undefined }) {
  if (!ev) {
    return (
      <div className="mx-auto h-3 max-w-[480px] rounded bg-stone-800">
        <div className="h-full w-1/2 rounded-l bg-stone-100/80" />
      </div>
    );
  }

  let whitePercent = 50;
  if (ev.mate !== undefined) {
    whitePercent = ev.mate > 0 ? 100 : 0;
  } else {
    const clamped = Math.max(-800, Math.min(800, ev.cp));
    whitePercent = 50 + (clamped / 800) * 50;
  }

  return (
    <div className="mx-auto flex h-3 max-w-[480px] overflow-hidden rounded bg-stone-900">
      <div
        className="h-full bg-stone-100 transition-all duration-300"
        style={{ width: `${whitePercent}%` }}
      />
      <div
        className="h-full bg-stone-700 transition-all duration-300"
        style={{ width: `${100 - whitePercent}%` }}
      />
    </div>
  );
}
