import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { GameBoard } from "@/components/GameBoard";
import { GameChat } from "@/components/GameChat";
import { getGuestSessionId } from "@/lib/guestSession";

function playerColorForGame(
  game: Doc<"games"> | null | undefined,
  userId: string | undefined,
  guestSessionId: string,
): "white" | "black" | null {
  if (!game) return null;
  if (userId) {
    if (game.whiteUserId === userId) return "white";
    if (game.blackUserId === userId) return "black";
  }
  if (game.whiteGuestSessionId === guestSessionId) return "white";
  if (game.blackGuestSessionId === guestSessionId) return "black";
  return null;
}

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const guestSessionId = getGuestSessionId();

  const game = useQuery(
    api.games.get,
    gameId ? { gameId: gameId as Id<"games"> } : "skip",
  );

  const myColor = useMemo(
    () => playerColorForGame(game ?? undefined, user?._id, guestSessionId),
    [game, user?._id, guestSessionId],
  );

  const whiteName =
    game?.whiteGuestName ??
    (game?.whiteUserId ? "White" : game?.mode === "human_vs_engine" ? "You" : "White");
  const blackName =
    game?.blackGuestName ??
    (game?.blackUserId ? "Black" : game?.mode === "human_vs_engine" ? "Computer" : "Black");

  if (!gameId) {
    return <p className="text-red-400">Missing game id.</p>;
  }

  if (game === undefined) {
    return <p className="text-stone-400">Loading game…</p>;
  }

  if (!game) {
    return <p className="text-red-400">Game not found.</p>;
  }

  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-amber-400">
            {whiteName} vs {blackName}
          </h1>
          <p className="text-sm text-stone-500 capitalize">
            {game.status} · {game.mode.replace(/_/g, " ")}
            {myColor && ` · You are ${myColor}`}
          </p>
          {game.mode === "human_vs_engine" &&
            game.status === "active" &&
            game.currentTurn === "black" && (
              <p className="text-sm text-amber-400/90">Computer is thinking…</p>
            )}
          {game.endReason?.startsWith("engine_error:") && (
            <p className="text-sm text-red-400">
              Engine error: {game.endReason.replace(/^engine_error:\s*/, "")}
            </p>
          )}
        </div>
        <Link to="/dashboard" className="text-sm text-stone-400 hover:text-amber-300">
          Dashboard
        </Link>
      </div>

      {game.status === "waiting" && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/50 p-4 text-sm">
          <p>Waiting for opponent. Share this link:</p>
          <code className="mt-2 block break-all text-amber-300/90">{inviteUrl}</code>
          <button
            type="button"
            className="mt-2 rounded border border-stone-600 px-2 py-1 text-xs"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
          >
            Copy link
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <GameBoard game={game} myColor={myColor} isAuthenticated={isAuthenticated} />
        <GameChat
          gameId={game._id}
          guestSessionId={isAuthenticated ? undefined : guestSessionId}
          guestName={
            isAuthenticated
              ? undefined
              : myColor === "white"
                ? game.whiteGuestName ?? "Guest"
                : game.blackGuestName ?? "Guest"
          }
        />
      </div>
    </div>
  );
}
