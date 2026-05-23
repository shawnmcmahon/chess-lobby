import { Link, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Layout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-[#1a1a1f] text-stone-100">
      <header className="border-b border-stone-800 bg-[#121218]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-amber-400">
            Chess Lobby
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="hover:text-amber-300">
                  Dashboard
                </Link>
                <Link to="/profile" className="hover:text-amber-300">
                  Profile
                </Link>
                <Link to="/leaderboard" className="hover:text-amber-300">
                  Leaderboard
                </Link>
              </>
            )}
            {!isLoading && isAuthenticated ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-md border border-stone-700 px-3 py-1 hover:border-amber-600"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-amber-600 px-3 py-1 font-medium text-stone-950 hover:bg-amber-500"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
