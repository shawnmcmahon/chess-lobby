import { Chess } from "chess.js";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { getGuestSessionId } from "@/lib/guestSession";
import { ChessBoardView } from "@/components/ChessBoardView";
import { formatDaysLeft } from "@/lib/correspondenceClock";
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

export function AtelierBoard({ game, myColor, isAuthenticated, readOnly = false }: Props) {
  const makeMove = useMutation(api.games.makeMove);
  const resign = useMutation(api.games.resign);
  const [error, setError] = useState<string | null>(null);
  const guestSessionId = isAuthenticated ? undefined : getGuestSessionId();

  const now = useNow(game.status === "active");

  const elapsed = game.status === "active" && game.lastMoveAt ? now - game.lastMoveAt : 0;
  const displayWhite =
    game.whiteTimeMs !== undefined
      ? game.currentTurn === "white" && game.status === "active"
        ? game.whiteTimeMs - elapsed
        : game.whiteTimeMs
      : null;
  const displayBlack =
    game.blackTimeMs !== undefined
      ? game.currentTurn === "black" && game.status === "active"
        ? game.blackTimeMs - elapsed
        : game.blackTimeMs
      : null;

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
    <div className="atelier-board-frame">
      <div className="atelier-board-frame__brass">
        <div className="atelier-board-frame__inner">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="atelier-board-coord">a · b · c · d · e · f · g · h</span>
            <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              move {parseInt(game.fen.split(" ")[5] ?? "1", 10) || 1}
            </span>
          </div>
          <ChessBoardView
            fen={game.fen}
            orientation={boardOrientation}
            allowDragging={canMove}
            onPieceDrop={onDrop}
            readOnly={readOnly}
            allowDrawingArrows
          />
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              {engineThinking ? "machine cogitating" : `${game.currentTurn} to play`}
            </span>
            <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              {game.timeControlCategory ?? game.playType ?? "live"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <Dial label="Black" timeMs={displayBlack} active={game.currentTurn === "black" && game.status === "active"} playType={game.playType} turnDeadlineAt={game.turnDeadlineAt} daysPerTurn={game.daysPerTurn} isTurnSide={game.currentTurn === "black"} now={now} />
        <Dial label="White" timeMs={displayWhite} active={game.currentTurn === "white" && game.status === "active"} playType={game.playType} turnDeadlineAt={game.turnDeadlineAt} daysPerTurn={game.daysPerTurn} isTurnSide={game.currentTurn === "white"} now={now} />
      </div>

      {error && (
        <div className="atelier-ribbon mt-5" style={{ display: "block", textAlign: "center" }}>
          {error}
        </div>
      )}

      {game.status === "active" && myColor && !readOnly && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="atelier-btn atelier-btn--oxblood"
            onClick={() => void resign({ gameId: game._id as Id<"games">, guestSessionId })}
          >
            Concede
          </button>
        </div>
      )}

      {game.status === "finished" && (
        <div className="mt-6 text-center">
          <div className="atelier-rule">
            <span className="atelier-smallcaps">Final</span>
          </div>
          <div
            className="atelier-display"
            style={{ fontSize: "2.4rem", marginTop: 14 }}
          >
            {game.winner ? `${game.winner} wins` : "Drawn"}
          </div>
          <div className="atelier-smallcaps mt-2" style={{ color: "var(--atelier-brass)" }}>
            by {game.endReason ?? "agreement"}
          </div>
        </div>
      )}
    </div>
  );
}

function Dial({
  label,
  timeMs,
  active,
  playType,
  turnDeadlineAt,
  daysPerTurn,
  isTurnSide,
  now,
}: {
  label: string;
  timeMs: number | null;
  active: boolean;
  playType?: "live" | "correspondence";
  turnDeadlineAt?: number;
  daysPerTurn?: number;
  isTurnSide?: boolean;
  now: number;
}) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const low = (timeMs ?? Infinity) < 30_000;
  const corresValue =
    isTurnSide && turnDeadlineAt && daysPerTurn
      ? formatDaysLeft(turnDeadlineAt, now).replace(" left", "")
      : daysPerTurn
        ? `${daysPerTurn}d`
        : "—";

  return (
    <div className="flex flex-col items-center">
      <div className="atelier-smallcaps mb-3" style={{ color: "var(--atelier-brass)" }}>
        {label}
      </div>
      <div className="atelier-dial" style={active ? { boxShadow: "inset 0 0 24px rgba(194,162,88,0.35), 0 0 24px rgba(194,162,88,0.25), 0 18px 36px -16px rgba(0,0,0,0.7)" } : undefined}>
        <div className="atelier-dial__ticks">
          {ticks.map((i) => (
            <span
              key={i}
              className={`atelier-dial__tick${i % 5 === 0 ? " atelier-dial__tick--major" : ""}`}
              style={{ transform: `translateX(-50%) rotate(${i * 6}deg)` }}
            />
          ))}
        </div>
        <div className="atelier-dial__face">
          <div className="atelier-dial__label">
            {playType === "correspondence" ? (isTurnSide ? "to post" : "in reserve") : active ? "to play" : "in reserve"}
          </div>
          <div className={`atelier-dial__value${low ? " atelier-dial__value--low" : ""}`} style={playType === "correspondence" ? { fontSize: "1.6rem" } : undefined}>
            {playType === "correspondence" || timeMs === null ? corresValue : formatMs(timeMs)}
          </div>
        </div>
      </div>
    </div>
  );
}
