import { Link } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";

export type BrutalLeaderboardSortBy = "wins" | "losses" | "draws" | "rating";
export type BrutalLeaderboardCategory =
  | "all"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type BrutalLeaderboardRow = {
  userId: Id<"users">;
  rank: number;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winRatio: string;
};

export type BrutalLeaderboardProps = {
  sortBy: BrutalLeaderboardSortBy;
  setSortBy: (sort: BrutalLeaderboardSortBy) => void;
  category: BrutalLeaderboardCategory;
  setCategory: (category: BrutalLeaderboardCategory) => void;
  rows: BrutalLeaderboardRow[] | undefined;
};

const SORT_OPTIONS: { id: BrutalLeaderboardSortBy; label: string }[] = [
  { id: "wins", label: "MOST WINS" },
  { id: "losses", label: "MOST LOSSES" },
  { id: "draws", label: "MOST DRAWS" },
  { id: "rating", label: "HIGHEST RATING" },
];

export function BrutalLeaderboard({
  sortBy,
  setSortBy,
  category,
  setCategory,
  rows,
}: BrutalLeaderboardProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section
        className="brutal-card brutal-card--ink relative"
        style={{ padding: 24 }}
        data-tilt="right"
      >
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -18, left: 28 }} data-tilt="left">
          ★ HALL OF FAME
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 32 }}>
          BRAGGING RIGHTS
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          LEADERBOARD
        </h1>
      </section>

      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="brutal-tab"
            data-active={sortBy === id ? "true" : undefined}
            onClick={() => setSortBy(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {sortBy !== "rating" && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as BrutalLeaderboardCategory)}
          className="brutal-select max-w-xs"
        >
          <option value="all">ALL CATEGORIES</option>
          <option value="bullet">BULLET</option>
          <option value="blitz">BLITZ</option>
          <option value="rapid">RAPID</option>
          <option value="classical">CLASSICAL</option>
          <option value="correspondence">CORRESPONDENCE</option>
        </select>
      )}

      {!rows ? (
        <p className="brutal-display" style={{ fontSize: "1.2rem" }}>
          LOADING…
        </p>
      ) : rows.length === 0 ? (
        <div className="brutal-card brutal-card--paper" style={{ padding: 20 }}>
          <p className="brutal-chunk">NO STATS YET. BE THE FIRST.</p>
        </div>
      ) : (
        <div className="brutal-card overflow-x-auto" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead>
              <tr
                className="brutal-display"
                style={{
                  fontSize: "0.75rem",
                  background: "var(--brutal-ink)",
                  color: "var(--brutal-yellow)",
                }}
              >
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">PLAYER</th>
                {sortBy === "rating" ? (
                  <>
                    <th className="px-3 py-3 text-right">RATING</th>
                    <th className="px-3 py-3 text-right">W</th>
                    <th className="px-3 py-3 text-right">L</th>
                    <th className="px-3 py-3 text-right">D</th>
                    <th className="px-3 py-3 text-right">WIN %</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-right">W</th>
                    <th className="px-3 py-3 text-right">L</th>
                    <th className="px-3 py-3 text-right">D</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} style={{ borderTop: "3px solid var(--brutal-ink)" }}>
                  <td className="brutal-chunk px-3 py-2">{row.rank}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/player/${row.userId}`}
                      className="brutal-display hover:underline"
                      style={{ fontSize: "0.95rem" }}
                    >
                      {row.displayName.toUpperCase()}
                    </Link>
                    {sortBy !== "rating" && (
                      <span className="brutal-chunk ml-2 text-[0.75rem]">
                        ({row.rating})
                      </span>
                    )}
                  </td>
                  {sortBy === "rating" ? (
                    <>
                      <td
                        className="brutal-display px-3 py-2 text-right"
                        style={{ color: "var(--brutal-magenta)", fontSize: "0.95rem" }}
                      >
                        {row.rating}
                      </td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.wins}</td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.losses}</td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.draws}</td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.winRatio}</td>
                    </>
                  ) : (
                    <>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.wins}</td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.losses}</td>
                      <td className="brutal-chunk px-3 py-2 text-right">{row.draws}</td>
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
