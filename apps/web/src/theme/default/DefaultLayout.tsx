import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { PresenceProvider } from "@/components/PresenceProvider";
import { ThemeSwitcher } from "@/theme/ThemeSwitcher";

export function DefaultLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <PresenceProvider>
      <div className="default-stage min-h-screen">
        <div className="default-starfield" aria-hidden />
        <div className="default-grain" aria-hidden />
        <header className="default-glass sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="default-display text-xl">
              Chess Lobby
              <span className="default-mono ml-2 text-[0.55rem] font-normal uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
                Ember Observatory
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="default-mono default-nav-link">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="default-mono default-nav-link">
                    Profile
                  </Link>
                  <Link to="/leaderboard" className="default-mono default-nav-link">
                    Leaderboard
                  </Link>
                </>
              )}
              {!isLoading &&
                (isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="default-btn default-btn--ghost"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link to="/login" className="default-btn default-btn--primary">
                    Sign in
                  </Link>
                ))}
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="default-main mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
