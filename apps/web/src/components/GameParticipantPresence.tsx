import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const SESSION_PING_MS = 10_000;

export function GameParticipantPresence({
  gameId,
  isParticipant,
  guestSessionId,
}: {
  gameId: Id<"games">;
  isParticipant: boolean;
  guestSessionId?: string;
}) {
  const ping = useMutation(api.games.pingParticipantSession);
  const leave = useMutation(api.games.leaveParticipantSession);

  useEffect(() => {
    if (!isParticipant) {
      return;
    }

    let cancelled = false;

    const sendPing = () => {
      if (cancelled) {
        return;
      }
      void ping({ gameId, guestSessionId }).catch(() => {
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
  }, [gameId, guestSessionId, isParticipant, leave, ping]);

  return null;
}
