import { Link } from "react-router-dom";
import { categoryWinRatePercent } from "@/lib/stats";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
  "correspondence",
] as const;

type PublicStats = {
  bullet: { wins: number; losses: number; draws: number };
  blitz: { wins: number; losses: number; draws: number };
  rapid: { wins: number; losses: number; draws: number };
  classical: { wins: number; losses: number; draws: number };
  correspondence: { wins: number; losses: number; draws: number };
};

function gameResult(
  game: Doc<"games">,
  userId: Id<"users">,
): { label: string; className: string } {
  const isWhite = game.whiteUserId === userId;
  const isBlack = game.blackUserId === userId;
  if (!isWhite && !isBlack) {
    return { label: "—", className: "text-[var(--default-mist)]" };
  }
  if (!game.winner) {
    return { label: "Draw", className: "text-[var(--default-mist)]" };
  }
  const won =
    (game.winner === "white" && isWhite) || (game.winner === "black" && isBlack);
  return won
    ? { label: "Win", className: "text-[var(--default-success)]" }
    : { label: "Loss", className: "text-[var(--default-danger)]" };
}

export type DefaultPublicProfileProps = {
  view: "missing" | "loading" | "notFound" | "ready";
  profile:
    | {
        _id: Id<"users">;
        displayName?: string;
        name?: string;
        rating?: number;
        bio?: string;
      }
    | null
    | undefined;
  stats: PublicStats | null | undefined;
  finishedGames: Doc<"games">[];
  canLoadMore: boolean;
  onLoadMore: () => void;
};

export function DefaultPublicProfile({
  view,
  profile,
  stats,
  finishedGames,
  canLoadMore,
  onLoadMore,
}: DefaultPublicProfileProps) {
  if (view === "missing") {
    return <p className="text-[var(--default-danger)]">Missing player id.</p>;
  }

  if (view === "loading") {
    return <p className="default-mono text-[var(--default-mist)]">Loading…</p>;
  }

  if (view === "notFound" || !profile) {
    return <p className="text-[var(--default-danger)]">Player not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="default-panel default-panel--accent p-6">
        <Link
          to="/dashboard"
          className="default-mono text-sm text-[var(--default-mist)] hover:text-[var(--default-ember)]"
        >
          ← Dashboard
        </Link>
        <h1 className="default-display mt-3 text-3xl">
          {profile.displayName ?? profile.name ?? "Player"}
        </h1>
        <p className="default-mono mt-1 text-sm text-[var(--default-mist)]">
          Rating: {profile.rating ?? 1200}
        </p>
        {profile.bio && (
          <p className="mt-3 text-[var(--default-mist)]">{profile.bio}</p>
        )}
      </section>

      {stats && (
        <section className="default-panel p-4">
          <h2 className="default-display text-lg text-[var(--default-ember)]">Stats</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const s = stats[cat];
              return (
                <div key={cat} className="default-list-item px-3 py-2 text-sm capitalize">
                  <div className="font-medium">{cat}</div>
                  <div className="default-mono text-[var(--default-mist)]">
                    {s.wins}W / {s.losses}L / {s.draws}D ·{" "}
                    {categoryWinRatePercent(s.wins, s.losses, s.draws)} win rate
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="default-panel p-4">
        <h2 className="default-display text-lg text-[var(--default-ember)]">
          Recent games
        </h2>
        {finishedGames.length === 0 ? (
          <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">
            No finished games.
          </p>
        ) : (
          <table className="default-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>Result</th>
                <th>Category</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {finishedGames.map((game) => {
                const result = gameResult(game, profile._id);
                return (
                  <tr key={game._id}>
                    <td className={result.className}>{result.label}</td>
                    <td className="capitalize text-[var(--default-mist)]">
                      {game.timeControlCategory ?? "—"}
                    </td>
                    <td className="text-[var(--default-mist)]">
                      {new Date(game.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {canLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="default-btn default-btn--ghost mt-3 text-sm"
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}
