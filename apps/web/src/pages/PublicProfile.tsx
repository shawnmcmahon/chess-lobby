import { usePaginatedQuery, useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

function gameResult(
  game: Doc<"games">,
  userId: Id<"users">,
): { label: string; className: string } {
  const isWhite = game.whiteUserId === userId;
  const isBlack = game.blackUserId === userId;
  if (!isWhite && !isBlack) return { label: "—", className: "text-stone-400" };
  if (!game.winner) return { label: "Draw", className: "text-stone-300" };
  const won =
    (game.winner === "white" && isWhite) || (game.winner === "black" && isBlack);
  return won
    ? { label: "Win", className: "text-green-400" }
    : { label: "Loss", className: "text-red-400" };
}

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const profile = useQuery(
    api.users.getPublicProfile,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const stats = useQuery(
    api.users.getStats,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const { results: finishedGames, status, loadMore } = usePaginatedQuery(
    api.games.listFinishedForUser,
    userId ? { userId: userId as Id<"users"> } : "skip",
    { initialNumItems: 10 },
  );

  if (!userId) {
    return <p className="text-red-400">Missing player id.</p>;
  }
  if (profile === undefined) {
    return <p className="text-stone-400">Loading…</p>;
  }
  if (!profile) {
    return <p className="text-red-400">Player not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-stone-800 bg-[#121218] p-6">
        <Link to="/dashboard" className="text-sm text-stone-400 hover:text-amber-300">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-amber-400">
          {profile.displayName}
        </h1>
        <p className="text-sm text-stone-500">Rating: {profile.rating ?? 1200}</p>
        {profile.bio && <p className="mt-2 text-stone-300">{profile.bio}</p>}
      </div>

      {stats && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-3 font-medium text-amber-400">Stats</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const s = stats[cat];
              return (
                <div key={cat} className="rounded bg-stone-900/60 px-3 py-2 text-sm capitalize">
                  <div className="font-medium text-stone-300">{cat}</div>
                  <div className="text-stone-400">
                    {s.wins}W / {s.losses}L / {s.draws}D
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
        <h2 className="mb-3 font-medium text-amber-400">Recent games</h2>
        {finishedGames.length === 0 ? (
          <p className="text-sm text-stone-500">No finished games.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-stone-400">
              <tr>
                <th className="px-2 py-1 text-left">Result</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {finishedGames.map((game) => {
                const result = gameResult(game, profile._id);
                return (
                  <tr key={game._id} className="border-t border-stone-800">
                    <td className={`px-2 py-2 ${result.className}`}>{result.label}</td>
                    <td className="px-2 py-2 capitalize text-stone-400">
                      {game.timeControlCategory ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-stone-500">
                      {new Date(game.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {status === "CanLoadMore" && (
          <button
            type="button"
            onClick={() => loadMore(10)}
            className="mt-3 rounded border border-stone-700 px-3 py-1 text-sm"
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}
