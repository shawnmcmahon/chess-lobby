import { Link } from "react-router-dom";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { categoryWinRatePercent } from "@/lib/stats";
import type { BentoGameHistoryRow } from "./BentoProfile";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

export function BentoPublicProfile({
  profile,
  stats,
  gameHistory,
  canLoadMore,
  onLoadMore,
}: {
  profile: Doc<"users">;
  stats:
    | {
        bullet: { wins: number; losses: number; draws: number };
        blitz: { wins: number; losses: number; draws: number };
        rapid: { wins: number; losses: number; draws: number };
        classical: { wins: number; losses: number; draws: number };
        correspondence: { wins: number; losses: number; draws: number };
      }
    | undefined;
  gameHistory: BentoGameHistoryRow[];
  canLoadMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="bento-grid">
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-7"
        style={{ padding: 32, animationDelay: "0ms" }}
      >
        <Link
          to="/dashboard"
          className="bento-mono text-[0.72rem] opacity-60 hover:opacity-100"
        >
          ← Dashboard
        </Link>
        <div className="mt-4 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="bento-tile__eyebrow">Player</div>
            <h1
              className="bento-tile__title"
              style={{ fontSize: "2.6rem", marginTop: 8 }}
            >
              {profile.displayName ?? profile.name ?? "Player"}
            </h1>
            {profile.bio && (
              <p
                className="bento-mono mt-3 text-[0.78rem] opacity-80"
                style={{ lineHeight: 1.65, maxWidth: "48ch" }}
              >
                {profile.bio}
              </p>
            )}
          </div>
          <div className="text-right">
            <div
              className="bento-tile__num"
              style={{ fontSize: "2.8rem", color: "var(--bento-paper)" }}
            >
              {profile.rating ?? 1200}
            </div>
            <div className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              rating
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section
          className="bento-tile col-span-12 lg:col-span-5"
          style={{ padding: 24, animationDelay: "80ms" }}
        >
          <div className="bento-tile__eyebrow">Record</div>
          <h2
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            Stats by <em>category</em>
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const s = stats[cat];
              return (
                <div
                  key={cat}
                  className="rounded-xl px-3 py-2 capitalize"
                  style={{ background: "rgba(14,14,16,0.04)" }}
                >
                  <div className="bento-mono text-[0.68rem] uppercase tracking-widest opacity-70">
                    {cat}
                  </div>
                  <div className="bento-mono mt-1 text-sm">
                    {s.wins}W / {s.losses}L / {s.draws}D ·{" "}
                    {categoryWinRatePercent(s.wins, s.losses, s.draws)} win rate
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section
        className="bento-tile col-span-12"
        style={{ padding: 28, animationDelay: "160ms" }}
      >
        <div className="bento-tile__eyebrow">Recent</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.5rem", marginTop: 4 }}
        >
          Finished <em>games</em>
        </h2>

        {gameHistory.length === 0 ? (
          <p className="bento-mono mt-4 text-[0.75rem] opacity-60">
            No finished games.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full bento-mono text-[0.78rem]">
              <thead>
                <tr className="text-left opacity-60 uppercase tracking-widest text-[0.64rem]">
                  <th className="px-2 py-2">Result</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((row) => (
                  <tr
                    key={row.gameId}
                    className="border-t"
                    style={{ borderColor: "var(--bento-rule)" }}
                  >
                    <td className="px-2 py-2">
                      <ResultBadge label={row.resultLabel} tone={row.resultTone} />
                    </td>
                    <td className="px-2 py-2 capitalize opacity-70">
                      {row.category}
                    </td>
                    <td className="px-2 py-2 opacity-60">{row.date}</td>
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
            className="bento-btn bento-btn--ghost mt-4"
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}

export function BentoPublicProfileMissing() {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--clay col-span-12 lg:col-span-6"
        style={{ padding: 32 }}
      >
        <div className="bento-tile__eyebrow">Player</div>
        <h1 className="bento-tile__title" style={{ fontSize: "2rem", marginTop: 10 }}>
          Missing <em>id</em>
        </h1>
        <p className="bento-mono mt-4 text-[0.75rem] opacity-85">
          No player id was provided in the URL.
        </p>
      </section>
    </div>
  );
}

export function BentoPublicProfileLoading() {
  return (
    <p className="bento-mono opacity-60" style={{ marginTop: 32 }}>
      Loading…
    </p>
  );
}

export function BentoPublicProfileNotFound() {
  return (
    <div className="bento-grid" style={{ marginTop: 16 }}>
      <section
        className="bento-tile bento-tile--clay col-span-12 lg:col-span-6"
        style={{ padding: 32 }}
      >
        <div className="bento-tile__eyebrow">Player</div>
        <h1 className="bento-tile__title" style={{ fontSize: "2rem", marginTop: 10 }}>
          Not <em>found</em>
        </h1>
        <p className="bento-mono mt-4 text-[0.75rem] opacity-85">
          This player profile does not exist or is no longer available.
        </p>
        <Link to="/dashboard" className="bento-btn mt-6 inline-flex">
          ← Dashboard
        </Link>
      </section>
    </div>
  );
}

function ResultBadge({
  label,
  tone,
}: {
  label: string;
  tone: "win" | "loss" | "draw" | "neutral";
}) {
  const color =
    tone === "win"
      ? "var(--bento-jade)"
      : tone === "loss"
        ? "var(--bento-clay)"
        : "var(--bento-ash)";
  return (
    <span
      className="inline-block rounded-lg px-2 py-0.5 text-[0.72rem] uppercase tracking-wider"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  );
}
