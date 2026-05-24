import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { categoryWinRatePercent } from "@/lib/stats";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

export type BentoGameHistoryRow = {
  gameId: Id<"games">;
  opponent: string;
  resultLabel: string;
  resultTone: "win" | "loss" | "draw" | "neutral";
  category: string;
  date: string;
};

export function BentoProfile({
  user,
  stats,
  displayName,
  setDisplayName,
  bio,
  setBio,
  onSubmit,
  saved,
  gameHistory,
  canLoadMore,
  onLoadMore,
}: {
  user: Doc<"users">;
  stats:
    | {
        bullet: { wins: number; losses: number; draws: number };
        blitz: { wins: number; losses: number; draws: number };
        rapid: { wins: number; losses: number; draws: number };
        classical: { wins: number; losses: number; draws: number };
        correspondence: { wins: number; losses: number; draws: number };
        totalWins: number;
        totalLosses: number;
        totalDraws: number;
      }
    | undefined;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  saved: boolean;
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
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="bento-tile__eyebrow">Your profile</div>
            <h1
              className="bento-tile__title"
              style={{ fontSize: "2.4rem", marginTop: 8 }}
            >
              {user.displayName ?? user.name ?? "Player"}
            </h1>
          </div>
          <div className="text-right">
            <div
              className="bento-tile__num"
              style={{ fontSize: "2.8rem", color: "var(--bento-paper)" }}
            >
              {user.rating ?? 1200}
            </div>
            <div className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              rating
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
          <label className="block" htmlFor="bento-profile-display-name">
            <span className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              Display name
            </span>
            <input
              id="bento-profile-display-name"
              name="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bento-input mt-2"
            />
          </label>
          <label className="block" htmlFor="bento-profile-bio">
            <span className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-60">
              Bio
            </span>
            <textarea
              id="bento-profile-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bento-input mt-2 resize-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="bento-btn bento-btn--jade">
              Save changes
            </button>
            {saved && (
              <span
                className="bento-mono text-[0.72rem]"
                style={{ color: "var(--bento-jade-soft)" }}
              >
                Profile saved.
              </span>
            )}
          </div>
        </form>
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
          <p className="bento-mono mt-4 text-[0.72rem] opacity-60">
            Total · {stats.totalWins}W / {stats.totalLosses}L /{" "}
            {stats.totalDraws}D
          </p>
        </section>
      )}

      <section
        className="bento-tile col-span-12"
        style={{ padding: 28, animationDelay: "160ms" }}
      >
        <div className="bento-tile__eyebrow">Archive</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "1.5rem", marginTop: 4 }}
        >
          Game <em>history</em>
        </h2>

        {gameHistory.length === 0 ? (
          <p className="bento-mono mt-4 text-[0.75rem] opacity-60">
            No finished games yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full bento-mono text-[0.78rem]">
              <thead>
                <tr className="text-left opacity-60 uppercase tracking-widest text-[0.64rem]">
                  <th className="px-2 py-2">Opponent</th>
                  <th className="px-2 py-2">Result</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((row) => (
                  <tr
                    key={row.gameId}
                    className="border-t"
                    style={{ borderColor: "var(--bento-rule)" }}
                  >
                    <td className="px-2 py-2">{row.opponent}</td>
                    <td className="px-2 py-2">
                      <ResultBadge label={row.resultLabel} tone={row.resultTone} />
                    </td>
                    <td className="px-2 py-2 capitalize opacity-70">
                      {row.category}
                    </td>
                    <td className="px-2 py-2 opacity-60">{row.date}</td>
                    <td className="px-2 py-2">
                      <Link
                        to={`/game/${row.gameId}/review`}
                        className="hover:underline"
                        style={{ color: "var(--bento-jade)" }}
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
            className="bento-btn bento-btn--ghost mt-4"
          >
            Load more
          </button>
        )}
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
        : tone === "draw"
          ? "var(--bento-ash)"
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
