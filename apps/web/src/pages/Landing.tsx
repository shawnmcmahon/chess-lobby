import { Link } from "react-router-dom";
import { useConvexAuth } from "convex/react";

export function Landing() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12 text-center">
      <h1 className="text-4xl font-bold text-amber-400">Play chess with friends</h1>
      <p className="text-stone-400">
        Challenge players in the lobby, invite friends with a link, or practice against
        Stockfish.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="rounded-lg bg-amber-600 px-6 py-2 font-medium text-stone-950 hover:bg-amber-500"
          >
            Go to dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-amber-600 px-6 py-2 font-medium text-stone-950 hover:bg-amber-500"
          >
            Sign in with Google or email
          </Link>
        )}
      </div>
    </div>
  );
}
