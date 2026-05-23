import { Chess } from "chess.js";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { getGuestSessionId } from "@/lib/guestSession";
import { ChessBoardView } from "./ChessBoardView";
import { GameClock } from "./GameClock";

type GameBoardProps = {
  game: Doc<"games">;
  myColor: "white" | "black" | null;
  isAuthenticated: boolean;
  readOnly?: boolean;
};

export function GameBoard({
  game,
  myColor,
  isAuthenticated,
  readOnly = false,
}: GameBoardProps) {
  const makeMove = useMutation(api.games.makeMove);
  const resign = useMutation(api.games.resign);
  const [error, setError] = useState<string | null>(null);
  const guestSessionId = isAuthenticated ? undefined : getGuestSessionId();

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
    const attempted = trial.move({
      from: sourceSquare,
      to: targetSquare,
      promotion,
    });
    if (!attempted) return false;

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
    <div className="space-y-3">
      <GameClock
        whiteTimeMs={game.whiteTimeMs}
        blackTimeMs={game.blackTimeMs}
        currentTurn={game.currentTurn}
        lastMoveAt={game.lastMoveAt}
        status={game.status}
        playType={game.playType}
        turnDeadlineAt={game.turnDeadlineAt}
        daysPerTurn={game.daysPerTurn}
      />
      <div
        className="mx-auto flex min-h-6 max-w-[480px] items-center justify-center text-sm"
        aria-live="polite"
      >
        {engineThinking && (
          <span className="text-amber-400/90">Computer is thinking…</span>
        )}
      </div>
      <ChessBoardView
        fen={game.fen}
        orientation={boardOrientation}
        allowDragging={canMove}
        onPieceDrop={onDrop}
        readOnly={readOnly || !canMove}
      />
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
      {game.status === "active" && myColor && !readOnly && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              void resign({ gameId: game._id, guestSessionId })
            }
            className="rounded border border-red-800 px-3 py-1 text-sm text-red-300 hover:bg-red-950"
          >
            Resign
          </button>
        </div>
      )}
      {game.status === "finished" && (
        <p className="text-center text-amber-400">
          Game over — {game.endReason}
          {game.winner ? ` (${game.winner} wins)` : ""}
        </p>
      )}
    </div>
  );
}
