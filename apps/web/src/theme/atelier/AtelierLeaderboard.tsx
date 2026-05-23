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
    <div className="mx-auto max-w-4xl space-y-8 relative">
      <header className="text-center pb-2">
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Maison Échecs · Registry</span>
        </div>
        <h1
          className="atelier-display"
          style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontStyle: "italic" }}
        >
          The ledger of champions
        </h1>
      </header>

      <div className="flex flex-wrap gap-2 justify-center">
        {SORT_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSortByChange(id)}
            className="atelier-smallcaps"
            style={{
              padding: "8px 16px",
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
        <div className="atelier-panel relative overflow-x-auto">
          <Corners />
          <table className="w-full text-sm">
            <thead>
              <tr className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                <th className="px-3 py-2 text-left font-normal">#</th>
                <th className="px-3 py-2 text-left font-normal">Patron</th>
                {sortBy === "rating" ? (
                  <>
                    <th className="px-3 py-2 text-right font-normal">Rating</th>
                    <th className="px-3 py-2 text-right font-normal">W</th>
                    <th className="px-3 py-2 text-right font-normal">L</th>
                    <th className="px-3 py-2 text-right font-normal">D</th>
                    <th className="px-3 py-2 text-right font-normal">Win %</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-right font-normal">W</th>
                    <th className="px-3 py-2 text-right font-normal">L</th>
                    <th className="px-3 py-2 text-right font-normal">D</th>
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
                    className="px-3 py-2 atelier-mono"
                    style={{ fontSize: "0.78rem", color: "var(--atelier-brass-dim)" }}
                  >
                    {row.rank}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/player/${row.userId}`}
                      className="atelier-display"
                      style={{
                        fontSize: "1.15rem",
                        fontStyle: "italic",
                        color: "var(--atelier-parchment)",
                      }}
                    >
                      {row.displayName}
                    </Link>
                    {sortBy !== "rating" && (
                      <span
                        className="atelier-mono ml-2"
                        style={{ fontSize: "0.72rem", color: "var(--atelier-brass-dim)" }}
                      >
                        ({row.rating})
                      </span>
                    )}
                  </td>
                  {sortBy === "rating" ? (
                    <>
                      <td
                        className="px-3 py-2 text-right atelier-display"
                        style={{ fontSize: "1.1rem", color: "var(--atelier-brass)" }}
                      >
                        {row.rating}
                      </td>
                      <td className="px-3 py-2 text-right atelier-mono">{row.wins}</td>
                      <td className="px-3 py-2 text-right atelier-mono">{row.losses}</td>
                      <td className="px-3 py-2 text-right atelier-mono">{row.draws}</td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: "var(--atelier-parchment-soft)" }}
                      >
                        {row.winRatio ?? "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-right atelier-mono">{row.wins}</td>
                      <td className="px-3 py-2 text-right atelier-mono">{row.losses}</td>
                      <td className="px-3 py-2 text-right atelier-mono">{row.draws}</td>
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
