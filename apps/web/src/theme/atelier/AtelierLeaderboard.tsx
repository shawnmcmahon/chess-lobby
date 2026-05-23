import { Link } from "react-router-dom";

export type AtelierLeaderboardSort = "wins" | "losses" | "draws" | "rating";

export type AtelierLeaderboardCategory =
  | "all"
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type AtelierLeaderboardRow = {
  userId: string;
  rank: number;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winRatio?: string;
};

export type AtelierLeaderboardProps = {
  sortBy: AtelierLeaderboardSort;
  onSortByChange: (sort: AtelierLeaderboardSort) => void;
  category: AtelierLeaderboardCategory;
  onCategoryChange: (category: AtelierLeaderboardCategory) => void;
  rows: AtelierLeaderboardRow[] | undefined;
};

const SORT_OPTIONS: { id: AtelierLeaderboardSort; label: string }[] = [
  { id: "wins", label: "Most Wins" },
  { id: "losses", label: "Most Losses" },
  { id: "draws", label: "Most Draws" },
  { id: "rating", label: "Highest Rating" },
];

export function AtelierLeaderboard({
  sortBy,
  onSortByChange,
  category,
  onCategoryChange,
  rows,
}: AtelierLeaderboardProps) {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-4xl space-y-6 sm:space-y-8">
      <header className="pb-2 text-center">
        <div className="atelier-rule mb-4 sm:mb-6">
          <span className="atelier-smallcaps">Maison Échecs · Registry</span>
        </div>
        <h1
          className="atelier-display"
          style={{ fontSize: "clamp(2rem, 8vw, 3.8rem)", fontStyle: "italic" }}
        >
          The ledger of champions
        </h1>
      </header>

      <div className="-mx-1 flex flex-wrap justify-center gap-2 px-1">
        {SORT_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSortByChange(id)}
            className="atelier-smallcaps"
            style={{
              padding: "8px 12px",
              border: "1px solid var(--atelier-brass-dim)",
              color: sortBy === id ? "var(--atelier-obsidian)" : "var(--atelier-brass)",
              background: sortBy === id ? "var(--atelier-brass)" : "transparent",
              borderRadius: 2,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {sortBy !== "rating" && (
        <div className="flex justify-center">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as AtelierLeaderboardCategory)}
            className="atelier-select"
            style={{ maxWidth: 280 }}
          >
            <option value="all">All categories</option>
            <option value="bullet">Bullet</option>
            <option value="blitz">Blitz</option>
            <option value="rapid">Rapid</option>
            <option value="classical">Classical</option>
            <option value="correspondence">Correspondence</option>
          </select>
        </div>
      )}

      {!rows ? (
        <p className="atelier-smallcaps text-center" style={{ color: "var(--atelier-brass)" }}>
          Consulting the ledger…
        </p>
      ) : rows.length === 0 ? (
        <p
          className="text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "var(--atelier-parchment-soft)",
          }}
        >
          No statistics inscribed yet.
        </p>
      ) : (
        <div className="atelier-panel atelier-panel--table relative w-full min-w-0">
          <Corners />
          <div className="atelier-panel__scroll">
            <table
              className={`w-full text-sm ${sortBy === "rating" ? "min-w-[640px]" : "min-w-[320px]"}`}
            >
              <thead>
                <tr className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                  <th className="px-2 py-2 text-left font-normal sm:px-3">#</th>
                  <th className="px-2 py-2 text-left font-normal sm:px-3">Patron</th>
                {sortBy === "rating" ? (
                  <>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">Rating</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">W</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">L</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">D</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">Win %</th>
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">W</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">L</th>
                    <th className="px-2 py-2 text-right font-normal sm:px-3">D</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  style={{ borderTop: "1px solid rgba(194, 162, 88, 0.16)" }}
                >
                  <td
                    className="px-2 py-2 atelier-mono sm:px-3"
                    style={{ fontSize: "0.78rem", color: "var(--atelier-brass-dim)" }}
                  >
                    {row.rank}
                  </td>
                  <td className="max-w-[9rem] px-2 py-2 sm:max-w-none sm:px-3">
                    <Link
                      to={`/player/${row.userId}`}
                      className="atelier-display block truncate"
                      style={{
                        fontSize: "1.05rem",
                        fontStyle: "italic",
                        color: "var(--atelier-parchment)",
                      }}
                    >
                      {row.displayName}
                    </Link>
                    {sortBy !== "rating" && (
                      <span
                        className="atelier-mono ml-1 block sm:ml-2 sm:inline"
                        style={{ fontSize: "0.72rem", color: "var(--atelier-brass-dim)" }}
                      >
                        ({row.rating})
                      </span>
                    )}
                  </td>
                  {sortBy === "rating" ? (
                    <>
                      <td
                        className="px-2 py-2 text-right atelier-display sm:px-3"
                        style={{ fontSize: "1.1rem", color: "var(--atelier-brass)" }}
                      >
                        {row.rating}
                      </td>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.wins}</td>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.losses}</td>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.draws}</td>
                      <td
                        className="px-2 py-2 text-right sm:px-3"
                        style={{ color: "var(--atelier-parchment-soft)" }}
                      >
                        {row.winRatio ?? "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.wins}</td>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.losses}</td>
                      <td className="px-2 py-2 text-right atelier-mono sm:px-3">{row.draws}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
