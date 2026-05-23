import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

export type BrutalProfileGameRow = {
  gameId: Id<"games">;
  opponent: string;
  resultLabel: string;
  resultTone: "win" | "loss" | "draw" | "neutral";
  category: string;
  date: string;
};

export type BrutalProfileStats = {
  byCategory: Record<
    (typeof CATEGORIES)[number],
    { wins: number; losses: number; draws: number }
  >;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export type BrutalProfileProps = {
  user: Doc<"users"> | null | undefined;
  stats: BrutalProfileStats | null | undefined;
  displayName: string;
  setDisplayName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  saved: boolean;
  onSubmit: (e: FormEvent) => void;
  gameRows: BrutalProfileGameRow[];
  canLoadMore: boolean;
  onLoadMore: () => void;
};

function resultColor(tone: BrutalProfileGameRow["resultTone"]) {
  if (tone === "win") return "var(--brutal-blue)";
  if (tone === "loss") return "var(--brutal-magenta)";
  if (tone === "draw") return "var(--brutal-ink)";
  return "var(--brutal-ink)";
}

export function BrutalProfile({
  user,
  stats,
  displayName,
  setDisplayName,
  bio,
  setBio,
  saved,
  onSubmit,
  gameRows,
  canLoadMore,
  onLoadMore,
}: BrutalProfileProps) {
  if (!user) {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING PROFILE…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section
        className="brutal-card brutal-card--ink relative"
        style={{ padding: 24 }}
        data-tilt="left"
      >
        <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
          YOUR CARD
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 28 }}>
          ★ EDIT MODE
        </span>
        <h1 className="brutal-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
          YOUR PROFILE
        </h1>
        <p className="brutal-chunk mt-2" style={{ fontSize: "1.1rem", color: "var(--brutal-magenta)" }}>
          RATING · {user.rating ?? 1200}
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="brutal-input"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="BIO"
            className="brutal-input resize-y"
          />
          <button type="submit" className="brutal-btn brutal-btn--magenta">
            ▶ SAVE CHANGES
          </button>
        </form>
        {saved && (
          <p className="brutal-display mt-3" style={{ fontSize: "0.9rem", color: "var(--brutal-yellow)" }}>
            ✓ PROFILE SAVED
          </p>
        )}
      </section>

      {stats && (
        <section className="brutal-card relative" style={{ padding: 22 }} data-tilt="right">
          <span className="brutal-sticker brutal-sticker--blue" style={{ top: -16, right: 20 }} data-tilt="right">
            STATS
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
            BY CATEGORY
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const s = stats.byCategory[cat];
              return (
                <div
                  key={cat}
                  className="brutal-card brutal-card--paper"
                  style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
                >
                  <div className="brutal-display capitalize" style={{ fontSize: "0.85rem" }}>
                    {cat}
                  </div>
                  <div className="brutal-chunk mt-1 text-[0.95rem]">
                    {s.wins}W / {s.losses}L / {s.draws}D
                  </div>
                </div>
              );
            })}
          </div>
          <p className="brutal-chunk mt-4 text-[0.9rem]">
            TOTAL · {stats.totalWins}W / {stats.totalLosses}L / {stats.totalDraws}D
          </p>
        </section>
      )}

      <section className="brutal-card brutal-card--yellow relative" style={{ padding: 22 }}>
        <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -16, left: 22 }} data-tilt="left">
          ARCHIVE
        </span>
        <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
          GAME HISTORY
        </h2>
        {gameRows.length === 0 ? (
          <p className="brutal-chunk mt-4 text-[0.95rem]">NO FINISHED GAMES YET.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="brutal-display text-left" style={{ fontSize: "0.75rem" }}>
                  <th className="px-2 py-2">OPPONENT</th>
                  <th className="px-2 py-2">RESULT</th>
                  <th className="px-2 py-2">CATEGORY</th>
                  <th className="px-2 py-2">DATE</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {gameRows.map((row) => (
                  <tr
                    key={row.gameId}
                    style={{ borderTop: "2px dashed var(--brutal-ink)" }}
                  >
                    <td className="brutal-chunk px-2 py-2">{row.opponent}</td>
                    <td
                      className="brutal-display px-2 py-2"
                      style={{ color: resultColor(row.resultTone), fontSize: "0.85rem" }}
                    >
                      {row.resultLabel.toUpperCase()}
                    </td>
                    <td className="brutal-chunk px-2 py-2 capitalize">{row.category}</td>
                    <td className="brutal-chunk px-2 py-2">{row.date}</td>
                    <td className="px-2 py-2">
                      <Link
                        to={`/game/${row.gameId}/review`}
                        className="brutal-btn brutal-btn--blue"
                        style={{ padding: "6px 10px", fontSize: "0.72rem" }}
                      >
                        REVIEW
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
            className="brutal-btn brutal-btn--ink mt-4"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
          >
            ↓ LOAD MORE
          </button>
        )}
      </section>
    </div>
  );
}
