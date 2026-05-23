import usePresence from "@convex-dev/presence/react";
import { useConvexAuth, useQuery } from "convex/react";
import { createContext, useContext, type ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";

type PresenceState = ReturnType<typeof usePresence>;

const LobbyPresenceContext = createContext<PresenceState | undefined>(undefined);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const presenceState = usePresence(
    api.presence,
    "lobby",
    isAuthenticated && user?._id ? user._id : "",
    10000,
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
