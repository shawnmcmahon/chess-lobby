import { useConvexAuth, useQuery } from "convex/react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
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

export type GameController = ReturnType<typeof useGameController>;

export function useGameController() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const spectate = searchParams.get("spectate") === "1";
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const guestSessionId = getGuestSessionId();

  const game = useQuery(
    api.games.get,
    gameId
      ? { gameId: gameId as Id<"games">, guestSessionId }
      : "skip",
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

  return {
    gameId,
    spectate,
    isAuthenticated,
    user,
    guestSessionId,
    game,
    myColor,
    whiteName,
    blackName,
  };
}
