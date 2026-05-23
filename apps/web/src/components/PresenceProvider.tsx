import usePresence from "@convex-dev/presence/react";
import { useConvexAuth, useQuery } from "convex/react";
import { createContext, useContext, type ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type PresenceState = ReturnType<typeof usePresence>;

const LobbyPresenceContext = createContext<PresenceState | undefined>(undefined);

const PRESENCE_HEARTBEAT_MS = 10_000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const userId = useQuery(
    api.presence.getUserId,
    isAuthenticated ? {} : "skip",
  );

  if (!isAuthenticated || userId === undefined || userId === null) {
    return (
      <LobbyPresenceContext.Provider value={undefined}>
        {children}
      </LobbyPresenceContext.Provider>
    );
  }

  return (
    <PresenceWithUserId userId={userId}>{children}</PresenceWithUserId>
  );
}

function PresenceWithUserId({
  userId,
  children,
}: {
  userId: Id<"users">;
  children: ReactNode;
}) {
  const presenceState = usePresence(
    api.presence,
    "lobby",
    userId,
    PRESENCE_HEARTBEAT_MS,
  );

  return (
    <LobbyPresenceContext.Provider value={presenceState}>
      {children}
    </LobbyPresenceContext.Provider>
  );
}

export function useLobbyPresence() {
  return useContext(LobbyPresenceContext);
}
