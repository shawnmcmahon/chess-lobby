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

export function BrutalBoard({ game, myColor, isAuthenticated, readOnly = false }: Props) {
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
    !readOnly && game.status === "active" && myColor !== null && game.currentTurn === myColor;

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
        <p className="brutal-display text-center text-[0.85rem] text-[var(--brutal-magenta)]">
          FIRST MOVE · 30S OR ABORT
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <ClockBlock label="Black" time={displayBlackOrNull} active={game.currentTurn === "black"} status={game.status} playType={game.playType} turnDeadlineAt={game.turnDeadlineAt} daysPerTurn={game.daysPerTurn} isTurnSide={game.currentTurn === "black"} now={now} />
        <ClockBlock label="White" time={displayWhiteOrNull} active={game.currentTurn === "white"} status={game.status} playType={game.playType} turnDeadlineAt={game.turnDeadlineAt} daysPerTurn={game.daysPerTurn} isTurnSide={game.currentTurn === "white"} now={now} />
      </div>
      <div className="brutal-board-frame">
        <span className="brutal-sticker" style={{ top: -16, left: -16 }} data-tilt="left">
          THE RING
        </span>
        <span
          className="brutal-sticker brutal-sticker--magenta"
          style={{ top: -16, right: -16 }}
          data-tilt="right"
        >
          MOVE #{parseInt(game.fen.split(" ")[5] ?? "1", 10) || 1}
        </span>
        <div className="brutal-board-frame__inner">
          <ChessBoardView
            fen={game.fen}
            orientation={boardOrientation}
            allowDragging={canMove}
            onPieceDrop={onDrop}
            readOnly={readOnly}
            allowDrawingArrows
          />
        </div>
        <div
          className="mt-3 flex items-center justify-between brutal-display"
          style={{ color: "var(--brutal-yellow)", fontSize: "0.85rem" }}
        >
          <span>{engineThinking ? "CPU CALCULATING…" : game.timeControlCategory ?? game.playType ?? "live"}</span>
          <span>{(game.timeControlCategory ?? game.playType ?? "live").toUpperCase()}</span>
        </div>
      </div>
      {error && (
        <div className="brutal-card brutal-card--magenta brutal-display text-center" style={{ padding: 12 }}>
          ⚠ {error}
        </div>
      )}
      {game.status === "active" && myColor && !readOnly && (
        <div className="flex justify-center">
          <button
            type="button"
            className="brutal-btn brutal-btn--magenta"
            onClick={() => void resign({ gameId: game._id as Id<"games">, guestSessionId })}
          >
            ✗ RESIGN
          </button>
        </div>
      )}
      {game.status === "finished" && (
        <div
          className="brutal-card brutal-card--yellow text-center brutal-display"
          style={{ padding: 18, fontSize: "1.5rem" }}
          data-tilt="left"
        >
          GAME OVER · {(game.endReason ?? "").toUpperCase()}
          {game.winner && (
            <div className="brutal-chunk mt-1" style={{ fontSize: "2rem" }}>
              {game.winner.toUpperCase()} WINS
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClockBlock({
  label,
  time,
  active,
  status,
  playType,
  turnDeadlineAt,
  daysPerTurn,
  isTurnSide,
  now,
}: {
  label: string;
  time: number | null;
  active: boolean;
  status: string;
  playType?: "live" | "correspondence";
  turnDeadlineAt?: number;
  daysPerTurn?: number;
  isTurnSide?: boolean;
  now: number;
}) {
  if (playType === "correspondence" || time === null) {
    const corresLabel =
      isTurnSide && turnDeadlineAt && daysPerTurn
        ? formatDaysLeft(turnDeadlineAt, now).toUpperCase()
        : daysPerTurn
          ? `${daysPerTurn}D / TURN`
          : "CORRES.";
    return (
      <div className={`brutal-card ${isTurnSide && active ? "brutal-card--yellow" : ""}`} style={{ padding: 14 }}>
        <div className="brutal-display text-[0.8rem]">{label.toUpperCase()}</div>
        <div className="brutal-chunk" style={{ fontSize: "1.1rem", marginTop: 4 }}>
          {corresLabel}
        </div>
      </div>
    );
  }
  const low = time < 30_000 && status === "active";
  return (
    <div
      className={`brutal-card ${active ? "brutal-card--yellow" : ""}`}
      style={{ padding: 14 }}
    >
      <div className="brutal-display text-[0.8rem]">{label.toUpperCase()}</div>
      <div className={`brutal-clock ${low ? "brutal-clock--low" : ""}`}>
        {formatMs(time)}
      </div>
    </div>
  );
}
