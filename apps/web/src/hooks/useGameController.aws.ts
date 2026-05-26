/**
 * AWS rewrite example — mirrors useGameController.ts with the thin realtime SDK.
 * Production migration: replace convex imports across hooks/components with this pattern.
 */
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { channels } from "@/lib/realtime/channels";
import { useQuery } from "@/lib/realtime/hooks";
import { getGuestSessionId } from "@/lib/guestSession";

type GameDoc = {
  gameId: string;
  status: string;
  mode: string;
  fen: string;
  currentTurn: "white" | "black";
  whiteUserId?: string;
  blackUserId?: string;
  whiteGuestSessionId?: string;
  blackGuestSessionId?: string;
  whiteGuestName?: string;
  blackGuestName?: string;
};

type UserDoc = {
  userId: string;
  displayName?: string;
};

function playerColorForGame(
  game: GameDoc | null | undefined,
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

export function useGameControllerAws() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const spectate = searchParams.get("spectate") === "1";
  const guestSessionId = getGuestSessionId();

  const user = useQuery<UserDoc | null>(channels.users.current, {});
  const isAuthenticated = user != null;

  const game = useQuery<GameDoc | null>(
    channels.games.get,
    gameId ? { gameId, guestSessionId } : "skip",
  );

  const myColor = useMemo(
    () => playerColorForGame(game ?? undefined, user?.userId, guestSessionId),
    [game, user?.userId, guestSessionId],
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
