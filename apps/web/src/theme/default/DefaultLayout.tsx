import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ResponsiveHeader } from "@/components/ResponsiveHeader";
import { gameMainClassName, useIsLiveGameRoute } from "@/hooks/useIsLiveGameRoute";

export function DefaultLayout() {
  const { isAuthenticated } = useConvexAuth();
  const isGameRoute = useIsLiveGameRoute();

  return (
    <PresenceProvider>
      <div className="default-stage min-h-screen">
        <div className="default-starfield" aria-hidden />
        <div className="default-grain" aria-hidden />
        <ResponsiveHeader
          variant="default"
          headerClassName="default-glass sticky top-0 z-30"
          innerClassName="max-w-6xl"
          logo={
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="default-display block truncate text-lg sm:text-xl"
            >
              Chess Lobby
            </Link>
          }
        />
        <main
          className={gameMainClassName(
            "default-main mx-auto max-w-6xl px-4 py-5 sm:py-6",
            isGameRoute,
          )}
        >
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
