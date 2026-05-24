import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const SESSION_PING_MS = 10_000;

export function GameSpectatorPresence({
  gameId,
  isParticipant,
  isPrivate = false,
  guestSessionId,
  guestName,
}: {
  gameId: Id<"games">;
  isParticipant: boolean;
  isPrivate?: boolean;
  guestSessionId?: string;
  guestName?: string;
}) {
  const ping = useMutation(api.presence.pingSpectatorSession);
  const leave = useMutation(api.presence.leaveSpectatorSession);

  useEffect(() => {
    if (isParticipant || isPrivate) {
      return;
    }

    let cancelled = false;

    const sendPing = () => {
      if (cancelled) {
        return;
      }
      void ping({ gameId, guestSessionId, guestName }).catch(() => {
        // Ignore transient errors while navigating away.
      });
    };

    sendPing();
    const interval = window.setInterval(sendPing, SESSION_PING_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void leave({ gameId, guestSessionId }).catch(() => {
        // Ignore transient errors while navigating away.
      });
    };
  }, [gameId, guestName, guestSessionId, isParticipant, isPrivate, leave, ping]);

  return null;
}
