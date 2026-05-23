import { Link } from "react-router-dom";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

export type BrutalPublicProfileGameRow = {
  gameId: Id<"games">;
  resultLabel: string;
  resultTone: "win" | "loss" | "draw" | "neutral";
  category: string;
  date: string;
};

export type BrutalPublicProfileStats = {
  byCategory: Record<
    (typeof CATEGORIES)[number],
    { wins: number; losses: number; draws: number }
  >;
};

export type BrutalPublicProfileProps = {
  view: "missing" | "loading" | "notFound" | "ready";
  profile: Doc<"users"> | null | undefined;
  stats: BrutalPublicProfileStats | null | undefined;
  gameRows: BrutalPublicProfileGameRow[];
  canLoadMore: boolean;
  onLoadMore: () => void;
};

function resultColor(tone: BrutalPublicProfileGameRow["resultTone"]) {
  if (tone === "win") return "var(--brutal-blue)";
  if (tone === "loss") return "var(--brutal-magenta)";
  if (tone === "draw") return "var(--brutal-ink)";
  return "var(--brutal-ink)";
}

export function BrutalPublicProfile({
  view,
  profile,
  stats,
  gameRows,
  canLoadMore,
  onLoadMore,
}: BrutalPublicProfileProps) {
  if (view === "missing") {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ MISSING PLAYER ID
      </div>
    );
  }

  if (view === "loading") {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING…
      </p>
    );
  }

  if (view === "notFound" || !profile) {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ PLAYER NOT FOUND
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section
        className="brutal-card brutal-card--blue relative"
        style={{ padding: 24 }}
        data-tilt="left"
      >
        <span className="brutal-sticker" style={{ top: -16, right: 24 }} data-tilt="right">
          PUBLIC FILE
        </span>
        <Link
          to="/dashboard"
          className="brutal-chunk text-[0.85rem] hover:underline"
          style={{ color: "var(--brutal-yellow)" }}
        >
          ← LOBBY
        </Link>
        <h1 className="brutal-display mt-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
          {(profile.displayName ?? profile.name ?? "PLAYER").toUpperCase()}
        </h1>
        <p className="brutal-chunk mt-2" style={{ fontSize: "1.1rem" }}>
          RATING · {profile.rating ?? 1200}
        </p>
        {profile.bio && (
          <p className="brutal-chunk mt-4 text-[1rem]" style={{ lineHeight: 1.45 }}>
            {profile.bio}
          </p>
        )}
      </section>

      {stats && (
        <section className="brutal-card relative" style={{ padding: 22 }} data-tilt="right">
          <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -16, left: 22 }} data-tilt="left">
            RECORD
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
            STATS
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const s = stats.byCategory[cat];
              return (
                <div
                  key={cat}
                  className="brutal-card brutal-card--yellow"
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
        </section>
      )}

      <section className="brutal-card brutal-card--paper relative" style={{ padding: 22 }}>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 28 }}>
          RECENT GAMES
        </span>
        <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
          MATCH LOG
        </h2>
        {gameRows.length === 0 ? (
          <p className="brutal-chunk mt-4 text-[0.95rem]">NO FINISHED GAMES.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="brutal-display text-left" style={{ fontSize: "0.75rem" }}>
                  <th className="px-2 py-2">RESULT</th>
                  <th className="px-2 py-2">CATEGORY</th>
                  <th className="px-2 py-2">DATE</th>
                </tr>
              </thead>
              <tbody>
                {gameRows.map((row) => (
                  <tr
                    key={row.gameId}
                    style={{ borderTop: "2px dashed var(--brutal-ink)" }}
                  >
                    <td
                      className="brutal-display px-2 py-2"
                      style={{ color: resultColor(row.resultTone), fontSize: "0.85rem" }}
                    >
                      {row.resultLabel.toUpperCase()}
                    </td>
                    <td className="brutal-chunk px-2 py-2 capitalize">{row.category}</td>
                    <td className="brutal-chunk px-2 py-2">{row.date}</td>
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
