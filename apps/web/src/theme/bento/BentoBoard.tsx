import { Chess } from "chess.js";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { getGuestSessionId } from "@/lib/guestSession";
import { ChessBoardView } from "@/components/ChessBoardView";
import { formatDaysLeft } from "@/lib/correspondenceClock";
import { getLiveClockDisplay } from "@/lib/liveClock";
import { useNow } from "@/hooks/useNow";

type Props = {
  game: Doc<"games">;
  myColor: "white" | "black" | null;
  isAuthenticated: boolean;
  readOnly?: boolean;
};

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BentoBoard({ game, myColor, isAuthenticated, readOnly = false }: Props) {
  const makeMove = useMutation(api.games.makeMove);
  const resign = useMutation(api.games.resign);
  const [error, setError] = useState<string | null>(null);
  const guestSessionId = isAuthenticated ? undefined : getGuestSessionId();

  const now = useNow(game.status === "active");

  const { displayWhite, displayBlack, inFirstMovePhase } = getLiveClockDisplay(
    game,
    now,
  );
  const displayWhiteOrNull =
    game.whiteTimeMs !== undefined ? displayWhite : null;
  const displayBlackOrNull =
    game.blackTimeMs !== undefined ? displayBlack : null;

  const boardOrientation = myColor === "black" ? "black" : "white";
  const canMove =
    !readOnly &&
    game.status === "active" &&
    myColor !== null &&
    game.currentTurn === myColor;

  const chess = useMemo(() => new Chess(game.fen), [game.fen]);

  function onDrop({
    sourceSquare,
    targetSquare,
  }: {
    piece: unknown;
    sourceSquare: string;
    targetSquare: string | null;
  }) {
    if (!targetSquare || !canMove) return false;
    const piece = chess.get(sourceSquare as "a1");
    const promotion =
      piece?.type === "p" && (targetSquare[1] === "8" || targetSquare[1] === "1")
        ? "q"
        : undefined;
    const trial = new Chess(game.fen);
    if (!trial.move({ from: sourceSquare, to: targetSquare, promotion })) return false;
    setError(null);
    void makeMove({
      gameId: game._id as Id<"games">,
      from: sourceSquare,
      to: targetSquare,
      promotion,
      guestSessionId,
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Move failed");
    });
    return true;
  }

  const engineThinking =
    game.mode === "human_vs_engine" &&
    game.status === "active" &&
    game.currentTurn === "black";

  return (
    <div className="space-y-4">
      {inFirstMovePhase && (
        <p className="bento-mono text-center text-[0.72rem] text-[var(--bento-jade)]">
          First move · 30s to play or the game is aborted
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <ClockTile
          label="Black"
          time={displayBlackOrNull}
          active={game.currentTurn === "black" && game.status === "active"}
          playType={game.playType}
          turnDeadlineAt={game.turnDeadlineAt}
          daysPerTurn={game.daysPerTurn}
          currentTurn={game.currentTurn}
          now={now}
        />
        <ClockTile
          label="White"
          time={displayWhiteOrNull}
          active={game.currentTurn === "white" && game.status === "active"}
          playType={game.playType}
          turnDeadlineAt={game.turnDeadlineAt}
          daysPerTurn={game.daysPerTurn}
          currentTurn={game.currentTurn}
          now={now}
        />
      </div>
      <div className="bento-board-frame">
        <div className="mb-2 flex items-center justify-between">
          <span className="bento-board-rank">A · B · C · D · E · F · G · H</span>
          <span className="bento-board-rank">
            move {parseInt(game.fen.split(" ")[5] ?? "1", 10) || 1}
          </span>
        </div>
        <div className="bento-board-frame__inner">
          <ChessBoardView
            fen={game.fen}
            orientation={boardOrientation}
            allowDragging={canMove}
            onPieceDrop={onDrop}
            readOnly={readOnly}
            allowDrawingArrows
          />
        </div>
        <div className="mt-3 flex items-center justify-between bento-mono text-[0.7rem] uppercase tracking-wider opacity-60">
          <span>{engineThinking ? "Computer thinking…" : game.timeControlCategory ?? game.playType ?? "live"}</span>
        </div>
      </div>
      {error && (
        <p className="text-center text-sm" style={{ color: "var(--bento-clay)" }}>
          {error}
        </p>
      )}
      {game.status === "active" && myColor && !readOnly && (
        <div className="flex justify-center">
          <button
            type="button"
            className="bento-btn bento-btn--clay"
            onClick={() =>
              void resign({ gameId: game._id as Id<"games">, guestSessionId })
            }
          >
            Resign
          </button>
        </div>
      )}
      {game.status === "finished" && (
        <p
          className="text-center"
          style={{
            fontFamily: "'Fraunces', serif",
            fontStyle: "italic",
            fontSize: "1.25rem",
          }}
        >
          {game.endReason}
          {game.winner ? ` — ${game.winner} wins` : ""}
        </p>
      )}
    </div>
  );
}

function ClockTile({
  label,
  time,
  active,
  playType,
  turnDeadlineAt,
  daysPerTurn,
  currentTurn,
  now,
}: {
  label: string;
  time: number | null;
  active: boolean;
  playType?: "live" | "correspondence";
  turnDeadlineAt?: number;
  daysPerTurn?: number;
  currentTurn: "white" | "black";
  now: number;
}) {
  if (playType === "correspondence") {
    const isTurnSide =
      (label === "White" && currentTurn === "white") ||
      (label === "Black" && currentTurn === "black");
    const corresLabel =
      isTurnSide && turnDeadlineAt && daysPerTurn
        ? formatDaysLeft(turnDeadlineAt, now)
        : daysPerTurn
          ? `${daysPerTurn}d / turn`
          : "correspondence";
    return (
      <div
        className="bento-tile"
        style={{
          padding: 16,
          background: isTurnSide && active ? "var(--bento-jade)" : "var(--bento-paper)",
          color: isTurnSide && active ? "#fff" : "var(--bento-ink)",
        }}
      >
        <div className="bento-tile__eyebrow">{label}</div>
        <div className="bento-mono text-sm" style={{ marginTop: 6 }}>
          {corresLabel}
        </div>
      </div>
    );
  }
  if (time === null) {
    return (
      <div className="bento-tile" style={{ padding: 16, background: "var(--bento-paper)" }}>
        <div className="bento-tile__eyebrow">{label}</div>
        <div className="bento-mono text-sm" style={{ marginTop: 6 }}>
          —
        </div>
      </div>
    );
  }
  const low = time < 30_000;
  return (
    <div
      className="bento-tile"
      style={{
        padding: 16,
        background: active ? "var(--bento-ink)" : "var(--bento-paper)",
        color: active ? "var(--bento-paper)" : "var(--bento-ink)",
      }}
    >
      <div className="bento-tile__eyebrow">{label}</div>
      <div className={`bento-clock ${low ? "bento-clock--low" : ""}`}>
        {formatMs(time)}
      </div>
    </div>
  );
}
