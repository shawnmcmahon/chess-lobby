import usePresence from "@convex-dev/presence/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const PRESENCE_HEARTBEAT_MS = 10_000;

function GameObserverPresenceInner({
  gameId,
  userId,
}: {
  gameId: Id<"games">;
  userId: Id<"users">;
}) {
  usePresence(
    api.presence,
    `game:${gameId}:spectators`,
    userId,
    PRESENCE_HEARTBEAT_MS,
  );
  return null;
}

export function GameObserverPresence({
  gameId,
  isParticipant,
  isPrivate = false,
}: {
  gameId: Id<"games">;
  isParticipant: boolean;
  isPrivate?: boolean;
}) {
  const { isAuthenticated } = useConvexAuth();
  const userId = useQuery(
    api.presence.getUserId,
    isAuthenticated && !isParticipant && !isPrivate ? {} : "skip",
  );

  if (
    isParticipant ||
    isPrivate ||
    !isAuthenticated ||
    userId === undefined ||
    userId === null
  ) {
    return null;
  }

  return <GameObserverPresenceInner gameId={gameId} userId={userId} />;
}
