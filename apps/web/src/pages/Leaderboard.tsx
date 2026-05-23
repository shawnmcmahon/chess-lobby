import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

type SortBy = "wins" | "losses" | "draws" | "rating";
type Category =
  | "all"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

function winRatio(wins: number, losses: number, draws: number): string {
  const total = wins + losses + draws;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 1000) / 10}%`;
}

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortBy>("wins");
  const [category, setCategory] = useState<Category>("all");

  const rows = useQuery(api.leaderboard.listTop, {
    sortBy,
    category: category === "all" ? undefined : category,
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-amber-400">Leaderboard</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["wins", "Most Wins"],
            ["losses", "Most Losses"],
            ["draws", "Most Draws"],
            ["rating", "Highest Rating"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSortBy(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              sortBy === id
                ? "bg-amber-600 text-stone-950"
                : "border border-stone-700 hover:border-amber-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sortBy !== "rating" && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          <option value="bullet">Bullet</option>
          <option value="blitz">Blitz</option>
          <option value="rapid">Rapid</option>
          <option value="classical">Classical</option>
          <option value="correspondence">Correspondence</option>
        </select>
      )}

      {!rows ? (
        <p className="text-stone-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-500">No stats yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-800">
          <table className="w-full text-sm">
            <thead className="bg-stone-900 text-stone-400">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                {sortBy === "rating" ? (
                  <>
                    <th className="px-3 py-2 text-right">Rating</th>
                    <th className="px-3 py-2 text-right">W</th>
                    <th className="px-3 py-2 text-right">L</th>
                    <th className="px-3 py-2 text-right">D</th>
                    <th className="px-3 py-2 text-right">Win %</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-right">W</th>
                    <th className="px-3 py-2 text-right">L</th>
                    <th className="px-3 py-2 text-right">D</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-t border-stone-800">
                  <td className="px-3 py-2 text-stone-500">{row.rank}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/player/${row.userId}`}
                      className="font-medium hover:text-amber-300"
                    >
                      {row.displayName}
                    </Link>
                    {sortBy !== "rating" && (
                      <span className="ml-2 text-xs text-stone-500">
                        ({row.rating})
                      </span>
                    )}
                  </td>
                  {sortBy === "rating" ? (
                    <>
                      <td className="px-3 py-2 text-right font-medium text-amber-400">
                        {row.rating}
                      </td>
                      <td className="px-3 py-2 text-right">{row.wins}</td>
                      <td className="px-3 py-2 text-right">{row.losses}</td>
                      <td className="px-3 py-2 text-right">{row.draws}</td>
                      <td className="px-3 py-2 text-right text-stone-300">
                        {winRatio(row.wins, row.losses, row.draws)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-right">{row.wins}</td>
                      <td className="px-3 py-2 text-right">{row.losses}</td>
                      <td className="px-3 py-2 text-right">{row.draws}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
