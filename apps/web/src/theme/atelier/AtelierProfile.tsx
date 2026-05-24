import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { categoryWinRatePercent } from "@/lib/stats";

export type AtelierResultTone = "win" | "loss" | "draw" | "neutral";

export type AtelierProfileStat = {
  category: string;
  wins: number;
  losses: number;
  draws: number;
};

export type AtelierProfileGameRow = {
  id: string;
  opponent: string;
  resultLabel: string;
  resultTone: AtelierResultTone;
  category: string;
  date: string;
  reviewHref: string;
};

export type AtelierProfileProps = {
  loading: boolean;
  rating: number;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  saved: boolean;
  onSubmit: (e: FormEvent) => void;
  stats: AtelierProfileStat[] | null;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  gameRows: AtelierProfileGameRow[];
  canLoadMore: boolean;
  onLoadMore: () => void;
};

const resultColor: Record<AtelierResultTone, string> = {
  win: "var(--atelier-brass)",
  loss: "var(--atelier-oxblood)",
  draw: "var(--atelier-parchment-soft)",
  neutral: "var(--atelier-parchment-soft)",
};

export function AtelierProfile({
  loading,
  rating,
  displayName,
  onDisplayNameChange,
  bio,
  onBioChange,
  saved,
  onSubmit,
  stats,
  totalWins,
  totalLosses,
  totalDraws,
  gameRows,
  canLoadMore,
  onLoadMore,
}: AtelierProfileProps) {
  if (loading) {
    return (
      <p className="atelier-smallcaps text-center mt-12" style={{ color: "var(--atelier-brass)" }}>
        Opening the ledger…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 relative">
      <header className="text-center pb-2">
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">Member registry</span>
        </div>
        <h1
          className="atelier-display"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontStyle: "italic" }}
        >
          Your profile
        </h1>
        <p className="atelier-smallcaps mt-3" style={{ color: "var(--atelier-brass)" }}>
          Rating · {rating}
        </p>
      </header>

      <section className="atelier-panel relative">
        <Corners />
        <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
          Personal inscription
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
          <label className="block" htmlFor="atelier-profile-display-name">
            <span className="atelier-smallcaps">Display name</span>
            <input
              id="atelier-profile-display-name"
              name="displayName"
              required
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="atelier-input mt-2"
            />
          </label>
          <label className="block" htmlFor="atelier-profile-bio">
            <span className="atelier-smallcaps">Bio (optional)</span>
            <textarea
              id="atelier-profile-bio"
              name="bio"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              rows={3}
              className="atelier-input mt-2 resize-none"
            />
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <button type="submit" className="atelier-btn">
              Save changes
            </button>
            {saved && (
              <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                Inscription saved.
              </span>
            )}
          </div>
        </form>
      </section>

      {stats && (
        <section className="atelier-panel relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Performance by cadence
          </div>
          <h2
            className="atelier-display mt-2"
            style={{ fontSize: "1.8rem", fontStyle: "italic" }}
          >
            Stats by category
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
                  {s.wins}W / {s.losses}L / {s.draws}D ·{" "}
                  {categoryWinRatePercent(s.wins, s.losses, s.draws)} win rate
                </div>
              </div>
            ))}
          </div>
          <p
            className="atelier-smallcaps mt-4"
            style={{ color: "var(--atelier-brass-dim)" }}
          >
            Total · {totalWins}W / {totalLosses}L / {totalDraws}D
          </p>
        </section>
      )}

      <section className="atelier-panel relative">
        <Corners />
        <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
          Match archive
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
            No finished games yet — the ledger awaits your first match.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                  <th className="px-2 py-2 text-left font-normal">Opponent</th>
                  <th className="px-2 py-2 text-left font-normal">Result</th>
                  <th className="px-2 py-2 text-left font-normal">Cadence</th>
                  <th className="px-2 py-2 text-left font-normal">Date</th>
                  <th className="px-2 py-2 text-left font-normal" />
                </tr>
              </thead>
              <tbody>
                {gameRows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderTop: "1px solid rgba(194, 162, 88, 0.16)" }}
                  >
                    <td
                      className="px-2 py-2"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                      }}
                    >
                      {row.opponent}
                    </td>
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
                    <td className="px-2 py-2">
                      <Link
                        to={row.reviewHref}
                        className="atelier-smallcaps"
                        style={{ color: "var(--atelier-brass)" }}
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canLoadMore && (
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
