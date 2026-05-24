import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ResponsiveHeader } from "@/components/ResponsiveHeader";

export function DefaultLayout() {
  const { isAuthenticated } = useConvexAuth();

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
              <span className="default-mono ml-0 mt-0.5 block text-[0.5rem] font-normal uppercase tracking-[0.28em] text-[var(--default-ember-dim)] sm:ml-2 sm:mt-0 sm:inline sm:text-[0.55rem]">
                Ember Observatory
              </span>
            </Link>
          }
        />
        <main className="default-main app-main--with-dock mx-auto max-w-6xl px-4 py-5 sm:py-6">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
