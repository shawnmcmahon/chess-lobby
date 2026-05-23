import { Link } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";

export type DefaultLeaderboardSortBy = "wins" | "losses" | "draws" | "rating";
export type DefaultLeaderboardCategory =
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

export function DefaultLeaderboard({
  sortBy,
  setSortBy,
  category,
  setCategory,
  rows,
}: {
  sortBy: DefaultLeaderboardSortBy;
  setSortBy: (sort: DefaultLeaderboardSortBy) => void;
  category: DefaultLeaderboardCategory;
  setCategory: (category: DefaultLeaderboardCategory) => void;
  rows:
    | {
        rank: number;
        userId: Id<"users">;
        displayName: string;
        rating: number;
        wins: number;
        losses: number;
        draws: number;
      }[]
    | undefined;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="default-panel default-panel--accent p-6">
        <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
          Rankings
        </p>
        <h1 className="default-display mt-2 text-3xl">Leaderboard</h1>
      </section>

      <div className="default-tabs flex flex-wrap gap-2">
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
            className="default-tab"
            data-active={sortBy === id ? "true" : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {sortBy !== "rating" && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DefaultLeaderboardCategory)}
          className="default-input max-w-xs"
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
        <p className="default-mono text-[var(--default-mist)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="default-mono text-[var(--default-mist)]">No stats yet.</p>
      ) : (
        <div className="default-panel overflow-x-auto p-0">
          <table className="default-table w-full text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                {sortBy === "rating" ? (
                  <>
                    <th className="text-right">Rating</th>
                    <th className="text-right">W</th>
                    <th className="text-right">L</th>
                    <th className="text-right">D</th>
                    <th className="text-right">Win %</th>
                  </>
                ) : (
                  <>
                    <th className="text-right">W</th>
                    <th className="text-right">L</th>
                    <th className="text-right">D</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId}>
                  <td className="text-[var(--default-mist)]">{row.rank}</td>
                  <td>
                    <Link
                      to={`/player/${row.userId}`}
                      className="font-medium hover:text-[var(--default-ember)]"
                    >
                      {row.displayName}
                    </Link>
                    {sortBy !== "rating" && (
                      <span className="default-mono ml-2 text-xs text-[var(--default-mist)]">
                        ({row.rating})
                      </span>
                    )}
                  </td>
                  {sortBy === "rating" ? (
                    <>
                      <td className="text-right font-medium text-[var(--default-ember)]">
                        {row.rating}
                      </td>
                      <td className="text-right">{row.wins}</td>
                      <td className="text-right">{row.losses}</td>
                      <td className="text-right">{row.draws}</td>
                      <td className="text-right">
                        {winRatio(row.wins, row.losses, row.draws)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-right">{row.wins}</td>
                      <td className="text-right">{row.losses}</td>
                      <td className="text-right">{row.draws}</td>
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
