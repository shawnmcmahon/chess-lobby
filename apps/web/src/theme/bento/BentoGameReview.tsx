import { Link } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ChessBoardView } from "@/components/ChessBoardView";
import { EvalBar } from "@/components/EvalBar";
import { MoveList, type MoveRow } from "@/components/MoveList";
import type { MoveEval } from "@/hooks/useStockfishAnalysis";

export function BentoGameReview({
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
    <div className="bento-grid">
      <section
        className="bento-tile bento-tile--ink col-span-12"
        style={{ padding: 28, animationDelay: "0ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="bento-tile__eyebrow">Analysis</div>
            <h1
              className="bento-tile__title"
              style={{ fontSize: "2rem", marginTop: 6 }}
            >
              Game <em>review</em>
            </h1>
            <p className="bento-mono mt-2 text-[0.72rem] opacity-70">
              {resultText} · {endReason}
              {loading && ` · analyzing ${progress}%`}
            </p>
          </div>
          <Link
            to={`/game/${gameId}`}
            className="bento-btn bento-btn--ghost"
            style={{
              color: "var(--bento-paper)",
              borderColor: "rgba(245,241,234,0.3)",
            }}
          >
            ← Back to game
          </Link>
        </div>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-8"
        style={{ padding: 24, animationDelay: "80ms" }}
      >
        <div className="space-y-3">
          <EvalBar eval={currentEval} />
          <div className="bento-board-frame">
            <div className="bento-board-frame__inner">
              <ChessBoardView fen={currentFen} readOnly allowDrawingArrows />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <ReplayButton onClick={replay.goFirst} label="⏮" />
            <ReplayButton onClick={replay.goPrev} label="◀" />
            <button
              type="button"
              onClick={replay.togglePlay}
              className="bento-btn bento-btn--jade"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              {replay.playing ? "Pause" : "Play"}
            </button>
            <ReplayButton onClick={replay.goNext} label="▶" />
            <ReplayButton onClick={replay.goLast} label="⏭" />
          </div>
        </div>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-4"
        style={{ padding: 24, animationDelay: "160ms" }}
      >
        <div className="bento-tile__eyebrow">Moves</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.35rem", marginTop: 4 }}
        >
          Notation & <em>eval</em>
        </h2>
        <div className="mt-4 space-y-3">
          <MoveList
            rows={rowsWithEvals}
            plyIndex={replay.plyIndex}
            onSelectPly={replay.setPlyIndex}
          />
          <p className="bento-mono text-[0.68rem] opacity-60">
            Move {replay.plyIndex} / {totalPlies} · use ← → keys
          </p>
        </div>
      </section>
    </div>
  );
}

export function BentoGameReviewMissing() {
  return (
    <p className="bento-mono" style={{ marginTop: 32, color: "var(--bento-clay)" }}>
      Missing game id.
    </p>
  );
}

export function BentoGameReviewLoading() {
  return (
    <p className="bento-mono opacity-60" style={{ marginTop: 32 }}>
      Loading review…
    </p>
  );
}

export function BentoGameReviewNotFound({
  message = "Finished game not found.",
}: {
  message?: string;
}) {
  return (
    <p className="bento-mono" style={{ marginTop: 32, color: "var(--bento-clay)" }}>
      {message}
    </p>
  );
}

function ReplayButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bento-btn bento-btn--ghost"
      style={{ padding: "8px 12px", fontSize: "0.85rem", minWidth: 44 }}
    >
      {label}
    </button>
  );
}
