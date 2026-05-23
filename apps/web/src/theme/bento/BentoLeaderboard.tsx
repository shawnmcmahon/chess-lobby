import { Link } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";

export type BentoLeaderboardSortBy = "wins" | "losses" | "draws" | "rating";
export type BentoLeaderboardCategory =
  | "all"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type BentoLeaderboardRow = {
  rank: number;
  userId: Id<"users">;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winRatio: string;
};

export function BentoLeaderboard({
  sortBy,
  setSortBy,
  category,
  setCategory,
  rows,
}: {
  sortBy: BentoLeaderboardSortBy;
  setSortBy: (sort: BentoLeaderboardSortBy) => void;
  category: BentoLeaderboardCategory;
  setCategory: (category: BentoLeaderboardCategory) => void;
  rows: BentoLeaderboardRow[] | undefined;
}) {
  const sortOptions = [
    ["wins", "Most Wins"],
    ["losses", "Most Losses"],
    ["draws", "Most Draws"],
    ["rating", "Highest Rating"],
  ] as const;

  return (
    <div className="bento-grid">
      <section
        className="bento-tile bento-tile--ink col-span-12"
        style={{ padding: 32, animationDelay: "0ms" }}
      >
        <div className="bento-pill">Rankings · Live</div>
        <h1
          className="bento-tile__title"
          style={{ fontSize: "2.8rem", marginTop: 16 }}
        >
          The <em>leaderboard</em>
        </h1>
        <p className="bento-mono mt-3 text-[0.72rem] opacity-70">
          Top players by wins, losses, draws, or rating — filter by time control.
        </p>
      </section>

      <section
        className="bento-tile col-span-12"
        style={{ padding: 24, animationDelay: "80ms" }}
      >
        <div className="flex flex-wrap gap-2">
          {sortOptions.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSortBy(id)}
              className="bento-tab"
              data-active={sortBy === id ? "true" : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {sortBy !== "rating" && (
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as BentoLeaderboardCategory)
            }
            className="bento-select mt-4 max-w-xs"
          >
            <option value="all">All categories</option>
            <option value="bullet">Bullet</option>
            <option value="blitz">Blitz</option>
            <option value="rapid">Rapid</option>
            <option value="classical">Classical</option>
            <option value="correspondence">Correspondence</option>
          </select>
        )}

        <div className="bento-divider" />

        {!rows ? (
          <p className="bento-mono text-[0.75rem] opacity-60">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="bento-mono text-[0.75rem] opacity-60">No stats yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bento-mono text-[0.78rem]">
              <thead>
                <tr className="text-left opacity-60 uppercase tracking-widest text-[0.64rem]">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Player</th>
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
                  <tr
                    key={row.userId}
                    className="border-t"
                    style={{ borderColor: "var(--bento-rule)" }}
                  >
                    <td className="px-3 py-2 opacity-50">{row.rank}</td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/player/${row.userId}`}
                        className="font-medium hover:underline"
                      >
                        {row.displayName}
                      </Link>
                      {sortBy !== "rating" && (
                        <span className="ml-2 text-[0.68rem] opacity-50">
                          ({row.rating})
                        </span>
                      )}
                    </td>
                    {sortBy === "rating" ? (
                      <>
                        <td
                          className="px-3 py-2 text-right font-medium"
                          style={{ color: "var(--bento-jade)" }}
                        >
                          {row.rating}
                        </td>
                        <td className="px-3 py-2 text-right">{row.wins}</td>
                        <td className="px-3 py-2 text-right">{row.losses}</td>
                        <td className="px-3 py-2 text-right">{row.draws}</td>
                        <td className="px-3 py-2 text-right opacity-80">
                          {row.winRatio}
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
      </section>
    </div>
  );
}
