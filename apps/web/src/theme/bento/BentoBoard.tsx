import { Chess } from "chess.js";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { getGuestSessionId } from "@/lib/guestSession";
import { ChessBoardView } from "@/components/ChessBoardView";
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

  const elapsed =
    game.status === "active" && game.lastMoveAt ? now - game.lastMoveAt : 0;
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
      <div className="grid grid-cols-2 gap-3">
        <ClockTile
          label="Black"
          time={displayBlack}
          active={game.currentTurn === "black" && game.status === "active"}
          playType={game.playType}
        />
        <ClockTile
          label="White"
          time={displayWhite}
          active={game.currentTurn === "white" && game.status === "active"}
          playType={game.playType}
        />
      </div>
      <div className="bento-board-frame">
        <div className="mb-2 flex items-center justify-between">
          <span className="bento-board-rank">A · B · C · D · E · F · G · H</span>
          <span className="bento-board-rank">
            {game.status} · move {parseInt(game.fen.split(" ")[5] ?? "1", 10) || 1}
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
          <span>
            {engineThinking ? "Computer thinking…" : `${game.currentTurn} to move`}
          </span>
          <span>{game.timeControlCategory ?? game.playType ?? "live"}</span>
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
}: {
  label: string;
  time: number | null;
  active: boolean;
  playType?: "live" | "correspondence";
}) {
  if (playType === "correspondence" || time === null) {
    return (
      <div
        className="bento-tile"
        style={{
          padding: 16,
          background: active ? "var(--bento-jade)" : "var(--bento-paper)",
          color: active ? "#fff" : "var(--bento-ink)",
        }}
      >
        <div className="bento-tile__eyebrow">{label}</div>
        <div className="bento-mono text-sm" style={{ marginTop: 6 }}>
          correspondence
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
