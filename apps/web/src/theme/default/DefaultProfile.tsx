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

type ProfileStats = {
  bullet: { wins: number; losses: number; draws: number };
  blitz: { wins: number; losses: number; draws: number };
  rapid: { wins: number; losses: number; draws: number };
  classical: { wins: number; losses: number; draws: number };
  correspondence: { wins: number; losses: number; draws: number };
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
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

function opponentName(game: Doc<"games">, userId: Id<"users">): string {
  if (game.whiteUserId === userId) {
    return game.blackGuestName ?? "Opponent";
  }
  return game.whiteGuestName ?? "Opponent";
}

export function DefaultProfile({
  user,
  stats,
  displayName,
  setDisplayName,
  bio,
  setBio,
  onSubmit,
  saved,
  finishedGames,
  canLoadMore,
  onLoadMore,
}: {
  user: Doc<"users">;
  stats: ProfileStats | undefined;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  saved: boolean;
  finishedGames: Doc<"games">[];
  canLoadMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="default-panel default-panel--accent p-6">
        <h1 className="default-display text-3xl">Your profile</h1>
        <p className="default-mono mt-1 text-sm text-[var(--default-mist)]">
          Rating: {user.rating ?? 1200}
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          <label className="block" htmlFor="default-profile-display-name">
            <span className="default-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--default-mist)]">
              Display name
            </span>
            <input
              id="default-profile-display-name"
              name="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="default-input mt-2"
            />
          </label>
          <label className="block" htmlFor="default-profile-bio">
            <span className="default-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--default-mist)]">
              Bio (optional)
            </span>
            <textarea
              id="default-profile-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="default-input mt-2 resize-y"
            />
          </label>
          <button type="submit" className="default-btn default-btn--primary">
            Save changes
          </button>
        </form>
        {saved && (
          <p className="default-mono mt-3 text-sm text-[var(--default-success)]">
            Profile saved.
          </p>
        )}
      </section>

      {stats && (
        <section className="default-panel p-4">
          <h2 className="default-display text-lg text-[var(--default-ember)]">
            Stats by category
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const s = stats[cat];
              return (
                <div key={cat} className="default-list-item px-3 py-2 text-sm capitalize">
                  <div className="font-medium">{cat}</div>
                  <div className="default-mono text-[var(--default-mist)]">
                    {s.wins}W / {s.losses}L / {s.draws}D
                  </div>
                </div>
              );
            })}
          </div>
          <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">
            Total: {stats.totalWins}W / {stats.totalLosses}L / {stats.totalDraws}D
          </p>
        </section>
      )}

      <section className="default-panel p-4">
        <h2 className="default-display text-lg text-[var(--default-ember)]">
          Game history
        </h2>
        {finishedGames.length === 0 ? (
          <p className="default-mono mt-3 text-sm text-[var(--default-mist)]">
            No finished games yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="default-table w-full text-sm">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Result</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {finishedGames.map((game) => {
                  const result = gameResult(game, user._id);
                  return (
                    <tr key={game._id}>
                      <td>{opponentName(game, user._id)}</td>
                      <td className={result.className}>{result.label}</td>
                      <td className="capitalize text-[var(--default-mist)]">
                        {game.timeControlCategory ?? "—"}
                      </td>
                      <td className="text-[var(--default-mist)]">
                        {new Date(game.updatedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          to={`/game/${game._id}/review`}
                          className="text-[var(--default-ember)] hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
