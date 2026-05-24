import { Link } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ChessBoardView } from "@/components/ChessBoardView";
import { EvalBar } from "@/components/EvalBar";
import { MoveList, type MoveRow } from "@/components/MoveList";
import type { MoveEval } from "@/hooks/useStockfishAnalysis";

export function DefaultGameReview({
  gameId,
  resultText,
  endReason,
  loading,
  progress,
  currentFen,
  currentEval,
  replay,
  rowsWithEvals,
  totalPlies,
}: {
  gameId: Id<"games">;
  resultText: string;
  endReason: string | undefined;
  loading: boolean;
  progress: number;
  currentFen: string;
  currentEval: MoveEval | null | undefined;
  replay: {
    goFirst: () => void;
    goPrev: () => void;
    togglePlay: () => void;
    goNext: () => void;
    goLast: () => void;
    playing: boolean;
    plyIndex: number;
    setPlyIndex: (ply: number) => void;
  };
  rowsWithEvals: MoveRow[];
  totalPlies: number;
}) {
  return (
    <div className="space-y-4">
      <section className="default-panel default-panel--accent flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="default-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--default-ember-dim)]">
            Post-mortem
          </p>
          <h1 className="default-display mt-1 text-2xl">Game review</h1>
          <p className="default-mono mt-1 text-sm text-[var(--default-mist)]">
            {resultText} · {endReason}
            {loading && ` · Analyzing ${progress}%`}
          </p>
        </div>
        <Link to={`/game/${gameId}`} className="default-btn default-btn--ghost text-sm">
          Back to game
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <EvalBar eval={currentEval} />
          <div className="default-board-frame">
            <div className="default-board-frame__glow" aria-hidden />
            <div className="default-board-frame__inner p-2">
              <ChessBoardView fen={currentFen} readOnly allowDrawingArrows />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={replay.goFirst}
              className="default-btn default-btn--ghost px-2 py-1 text-sm"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={replay.goPrev}
              className="default-btn default-btn--ghost px-2 py-1 text-sm"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={replay.togglePlay}
              className="default-btn default-btn--primary px-3 py-1 text-sm"
            >
              {replay.playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={replay.goNext}
              className="default-btn default-btn--ghost px-2 py-1 text-sm"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={replay.goLast}
              className="default-btn default-btn--ghost px-2 py-1 text-sm"
            >
              ⏭
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="default-panel p-3">
            <MoveList
              rows={rowsWithEvals}
              plyIndex={replay.plyIndex}
              onSelectPly={replay.setPlyIndex}
            />
          </div>
          <p className="default-mono text-xs text-[var(--default-mist)]">
            Move {replay.plyIndex} / {totalPlies} · Use ← → keys to navigate
          </p>
        </div>
      </div>
    </div>
  );
}

export function DefaultGameReviewMissing() {
  return <p className="text-[var(--default-danger)]">Missing game id.</p>;
}

export function DefaultGameReviewLoading() {
  return <p className="default-mono text-[var(--default-mist)]">Loading review…</p>;
}

export function DefaultGameReviewNotFound({
  message = "Finished game not found.",
}: {
  message?: string;
}) {
  return (
    <p className="text-[var(--default-danger)]">{message}</p>
  );
}
