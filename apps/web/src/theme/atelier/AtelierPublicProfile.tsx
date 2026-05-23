import { Link } from "react-router-dom";
import type { AtelierProfileStat, AtelierResultTone } from "./AtelierProfile";

export type AtelierPublicProfileGameRow = {
  id: string;
  resultLabel: string;
  resultTone: AtelierResultTone;
  category: string;
  date: string;
};

export type AtelierPublicProfileProps = {
  status: "missing" | "loading" | "not_found" | "ready";
  displayName?: string;
  rating?: number;
  bio?: string;
  stats?: AtelierProfileStat[];
  gameRows?: AtelierPublicProfileGameRow[];
  canLoadMore?: boolean;
  onLoadMore?: () => void;
};

const resultColor: Record<AtelierResultTone, string> = {
  win: "var(--atelier-brass)",
  loss: "var(--atelier-oxblood)",
  draw: "var(--atelier-parchment-soft)",
  neutral: "var(--atelier-parchment-soft)",
};

export function AtelierPublicProfile({
  status,
  displayName,
  rating,
  bio,
  stats,
  gameRows = [],
  canLoadMore,
  onLoadMore,
}: AtelierPublicProfileProps) {
  if (status === "missing") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Missing patron identifier.
      </p>
    );
  }

  if (status === "loading") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-brass)" }}>
        Opening the guest book…
      </p>
    );
  }

  if (status === "not_found") {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-oxblood)" }}>
        Patron not found in the registry.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 relative">
      <section className="atelier-panel relative">
        <Corners />
        <Link
          to="/dashboard"
          className="atelier-smallcaps"
          style={{ color: "var(--atelier-brass-dim)" }}
        >
          ← Return to salon
        </Link>
        <h1
          className="atelier-display mt-4"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontStyle: "italic" }}
        >
          {displayName}
        </h1>
        <p className="atelier-smallcaps mt-2" style={{ color: "var(--atelier-brass)" }}>
          Rating · {rating ?? 1200}
        </p>
        {bio && (
          <p
            className="mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
              lineHeight: 1.55,
              color: "var(--atelier-parchment-soft)",
            }}
          >
            {bio}
          </p>
        )}
      </section>

      {stats && (
        <section className="atelier-panel relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Performance record
          </div>
          <h2
            className="atelier-display mt-2"
            style={{ fontSize: "1.8rem", fontStyle: "italic" }}
          >
            Stats
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-5">
            {stats.map((s) => (
              <div
                key={s.category}
                className="atelier-panel"
                style={{
                  padding: "12px 16px",
                  background: "rgba(11, 20, 36, 0.4)",
                }}
              >
                <div
                  className="atelier-display capitalize"
                  style={{ fontSize: "1.2rem", fontStyle: "italic" }}
                >
                  {s.category}
                </div>
                <div
                  className="atelier-mono mt-1"
                  style={{ fontSize: "0.78rem", color: "var(--atelier-parchment-soft)" }}
                >
                  {s.wins}W / {s.losses}L / {s.draws}D
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="atelier-panel relative">
        <Corners />
        <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
          Recent matches
        </div>
        <h2
          className="atelier-display mt-2"
          style={{ fontSize: "1.8rem", fontStyle: "italic" }}
        >
          Game history
        </h2>
        {gameRows.length === 0 ? (
          <p
            className="mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: "var(--atelier-parchment-soft)",
            }}
          >
            No finished games on record.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                  <th className="px-2 py-2 text-left font-normal">Result</th>
                  <th className="px-2 py-2 text-left font-normal">Cadence</th>
                  <th className="px-2 py-2 text-left font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {gameRows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderTop: "1px solid rgba(194, 162, 88, 0.16)" }}
                  >
                    <td
                      className="px-2 py-2 atelier-display"
                      style={{
                        fontSize: "1rem",
                        color: resultColor[row.resultTone],
                      }}
                    >
                      {row.resultLabel}
                    </td>
                    <td
                      className="px-2 py-2 capitalize atelier-smallcaps"
                      style={{ color: "var(--atelier-parchment-soft)" }}
                    >
                      {row.category}
                    </td>
                    <td
                      className="px-2 py-2 atelier-mono"
                      style={{ fontSize: "0.75rem", color: "var(--atelier-brass-dim)" }}
                    >
                      {row.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canLoadMore && onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="atelier-btn atelier-btn--ghost mt-4"
          >
            Load more entries
          </button>
        )}
      </section>
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
