import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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

function opponentName(game: Doc<"games">, userId: Id<"users">): string {
  if (game.whiteUserId === userId) {
    return game.blackGuestName ?? "Opponent";
  }
  return game.whiteGuestName ?? "Opponent";
}

export function Profile() {
  const user = useQuery(api.users.current);
  const stats = useQuery(
    api.users.getStats,
    user ? { userId: user._id } : "skip",
  );
  const updateProfile = useMutation(api.users.updateProfile);
  const { results: finishedGames, status, loadMore } = usePaginatedQuery(
    api.games.listMyFinished,
    user ? {} : "skip",
    { initialNumItems: 10 },
  );
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await updateProfile({ displayName, bio: bio || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) {
    return <p className="text-stone-400">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-stone-800 bg-[#121218] p-6">
        <h1 className="text-2xl font-semibold text-amber-400">Your profile</h1>
        <p className="text-sm text-stone-500">Rating: {user.rating ?? 1200}</p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-stone-950 hover:bg-amber-500"
          >
            Save changes
          </button>
        </form>
        {saved && <p className="text-sm text-green-400">Profile saved.</p>}
      </div>

      {stats && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-3 font-medium text-amber-400">Stats by category</h2>
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
          <p className="mt-3 text-sm text-stone-500">
            Total: {stats.totalWins}W / {stats.totalLosses}L / {stats.totalDraws}D
          </p>
        </section>
      )}

      <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
        <h2 className="mb-3 font-medium text-amber-400">Game history</h2>
        {finishedGames.length === 0 ? (
          <p className="text-sm text-stone-500">No finished games yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-stone-400">
                <tr>
                  <th className="px-2 py-1 text-left">Opponent</th>
                  <th className="px-2 py-1 text-left">Result</th>
                  <th className="px-2 py-1 text-left">Category</th>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left" />
                </tr>
              </thead>
              <tbody>
                {finishedGames.map((game) => {
                  const result = gameResult(game, user._id);
                  return (
                    <tr key={game._id} className="border-t border-stone-800">
                      <td className="px-2 py-2">{opponentName(game, user._id)}</td>
                      <td className={`px-2 py-2 ${result.className}`}>{result.label}</td>
                      <td className="px-2 py-2 capitalize text-stone-400">
                        {game.timeControlCategory ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-stone-500">
                        {new Date(game.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2">
                        <Link
                          to={`/game/${game._id}/review`}
                          className="text-amber-400 hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {status === "CanLoadMore" && (
          <button
            type="button"
            onClick={() => loadMore(10)}
            className="mt-3 rounded border border-stone-700 px-3 py-1 text-sm hover:border-amber-600"
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}
