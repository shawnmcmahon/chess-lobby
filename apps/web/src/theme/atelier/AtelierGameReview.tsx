import { Link } from "react-router-dom";
import { ChessBoardView } from "@/components/ChessBoardView";
import { EvalBar } from "@/components/EvalBar";
import { MoveList, type MoveRow } from "@/components/MoveList";
import type { MoveEval } from "@/hooks/useStockfishAnalysis";

export type AtelierGameReviewStatus = "missing" | "loading" | "not_found" | "ready";

export type AtelierGameReviewReplay = {
  plyIndex: number;
  playing: boolean;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
  togglePlay: () => void;
  setPlyIndex: (ply: number) => void;
};

export type AtelierGameReviewProps = {
  status: AtelierGameReviewStatus;
  gameId?: string;
  resultText?: string;
  endReason?: string;
  isAnalyzing?: boolean;
  analyzingProgress?: number;
  currentFen?: string;
  currentEval?: MoveEval | null;
  replay?: AtelierGameReviewReplay;
  rowsWithEvals?: MoveRow[];
  totalPlies?: number;
};

export function AtelierGameReview({
  status,
  gameId,
  resultText,
  endReason,
  isAnalyzing,
  analyzingProgress,
  currentFen,
  currentEval,
  replay,
  rowsWithEvals = [],
  totalPlies = 0,
}: AtelierGameReviewProps) {
  if (status === "missing") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Missing match identifier.
      </p>
    );
  }

  if (status === "loading") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-brass)" }}>
        Opening the archive…
      </p>
    );
  }

  if (status === "not_found" || !replay || !currentFen || !gameId) {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Finished match not found in the ledger.
      </p>
    );
  }

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="atelier-rule mb-4">
            <span className="atelier-smallcaps">Post-match analysis</span>
          </div>
          <h1
            className="atelier-display"
            style={{ fontSize: "2rem", fontStyle: "italic" }}
          >
            Game review
          </h1>
          <p className="atelier-smallcaps mt-2" style={{ color: "var(--atelier-brass)" }}>
            {resultText} · {endReason}
            {isAnalyzing && ` · Analyzing ${analyzingProgress ?? 0}%`}
          </p>
        </div>
        <Link to={`/game/${gameId}`} className="atelier-btn atelier-btn--ghost">
          ← Back to match
        </Link>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div className="atelier-board-frame">
            <EvalBar eval={currentEval ?? null} />
            <div className="atelier-board-frame__brass mt-3">
              <div className="atelier-board-frame__inner">
                <ChessBoardView fen={currentFen} readOnly allowDrawingArrows />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={replay.goFirst}
              className="atelier-btn atelier-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "0.7rem" }}
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={replay.goPrev}
              className="atelier-btn atelier-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "0.7rem" }}
            >
              ◀
            </button>
            <button
              type="button"
              onClick={replay.togglePlay}
              className="atelier-btn"
              style={{ padding: "8px 18px", fontSize: "0.7rem" }}
            >
              {replay.playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={replay.goNext}
              className="atelier-btn atelier-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "0.7rem" }}
            >
              ▶
            </button>
            <button
              type="button"
              onClick={replay.goLast}
              className="atelier-btn atelier-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "0.7rem" }}
            >
              ⏭
            </button>
          </div>
        </section>

        <aside className="atelier-panel relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Move notation
          </div>
          <div className="mt-3">
            <MoveList
              rows={rowsWithEvals}
              plyIndex={replay.plyIndex}
              onSelectPly={replay.setPlyIndex}
            />
          </div>
          <p
            className="atelier-smallcaps mt-3"
            style={{ color: "var(--atelier-brass-dim)", fontSize: "0.65rem" }}
          >
            Move {replay.plyIndex} / {totalPlies} · Use ← → keys
          </p>
        </aside>
      </div>
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
