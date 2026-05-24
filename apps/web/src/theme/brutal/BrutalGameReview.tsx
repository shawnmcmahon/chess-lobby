import { Link } from "react-router-dom";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { ChessBoardView } from "@/components/ChessBoardView";
import { EvalBar } from "@/components/EvalBar";
import { MoveList, type MoveRow } from "@/components/MoveList";
import type { MoveEval } from "@/hooks/useStockfishAnalysis";

export type BrutalGameReviewProps = {
  view: "missing" | "loading" | "notFound" | "ready";
  game: Doc<"games"> | null | undefined;
  gameId: Id<"games"> | null;
  resultSummary: string;
  endReason: string | undefined;
  analyzing: boolean;
  analyzeProgress: number;
  currentFen: string;
  currentEval: MoveEval | null | undefined;
  rowsWithEvals: MoveRow[];
  plyIndex: number;
  totalPlies: number;
  playing: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onLast: () => void;
  onSelectPly: (ply: number) => void;
};

export function BrutalGameReview({
  view,
  game,
  gameId,
  resultSummary,
  endReason,
  analyzing,
  analyzeProgress,
  currentFen,
  currentEval,
  rowsWithEvals,
  plyIndex,
  totalPlies,
  playing,
  onFirst,
  onPrev,
  onTogglePlay,
  onNext,
  onLast,
  onSelectPly,
}: BrutalGameReviewProps) {
  if (view === "missing") {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ MISSING GAME ID
      </div>
    );
  }

  if (view === "loading") {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING REVIEW…
      </p>
    );
  }

  if (view === "notFound") {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ FINISHED GAME NOT FOUND
      </div>
    );
  }

  if (!game || !gameId) {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ FINISHED GAME NOT FOUND
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="brutal-card brutal-card--ink relative flex flex-wrap items-center justify-between gap-4"
        style={{ padding: 20 }}
      >
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -16, left: 24 }} data-tilt="left">
          ★ POST-MORTEM
        </span>
        <div>
          <h1 className="brutal-display" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
            GAME REVIEW
          </h1>
          <p className="brutal-chunk mt-2 text-[0.9rem]" style={{ color: "var(--brutal-paper)" }}>
            {resultSummary.toUpperCase()} · {endReason?.toUpperCase() ?? "FINISHED"}
            {analyzing && ` · ANALYZING ${analyzeProgress}%`}
          </p>
        </div>
        <Link to={`/game/${gameId}`} className="brutal-btn brutal-btn--magenta">
          ← BACK TO GAME
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <EvalBar eval={currentEval} />
          <div className="brutal-board-frame">
            <div className="brutal-board-frame__inner">
              <ChessBoardView fen={currentFen} readOnly allowDrawingArrows />
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" aria-label="First move" onClick={onFirst} className="brutal-btn" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
              ⏮
            </button>
            <button type="button" aria-label="Previous move" onClick={onPrev} className="brutal-btn" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
              ◀
            </button>
            <button type="button" onClick={onTogglePlay} className="brutal-btn brutal-btn--ink" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              {playing ? "PAUSE" : "PLAY"}
            </button>
            <button type="button" aria-label="Next move" onClick={onNext} className="brutal-btn" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
              ▶
            </button>
            <button type="button" aria-label="Last move" onClick={onLast} className="brutal-btn" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
              ⏭
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="brutal-card relative" style={{ padding: 16 }}>
            <span className="brutal-tape" style={{ position: "absolute", top: -14, left: 16 }}>
              MOVES
            </span>
            <MoveList
              rows={rowsWithEvals}
              plyIndex={plyIndex}
              onSelectPly={onSelectPly}
            />
          </div>
          <p className="brutal-chunk text-[0.8rem]">
            MOVE {plyIndex} / {totalPlies} · USE ← → KEYS
          </p>
        </div>
      </div>
    </div>
  );
}
