import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { getGuestSessionId } from "@/lib/guestSession";
import { useConvexAuth } from "convex/react";

export function JoinGame() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { isAuthenticated } = useConvexAuth();
  const game = useQuery(
    api.games.getByInviteToken,
    inviteToken ? { inviteToken } : "skip",
  );
  const join = useMutation(api.games.joinByInvite);
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onJoin(e?: FormEvent) {
    e?.preventDefault();
    if (!inviteToken) return;
    setError(null);
    try {
      const gameId = await join({
        inviteToken,
        guestName: isAuthenticated ? undefined : guestName.trim(),
        guestSessionId: isAuthenticated ? undefined : getGuestSessionId(),
      });
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join game");
    }
  }

  if (!inviteToken) {
    return <p className="text-red-400">Invalid invite link.</p>;
  }

  if (game === undefined) {
    return <p className="text-stone-400">Loading game…</p>;
  }

  if (!game) {
    return <p className="text-red-400">Game not found.</p>;
  }

  if (game.status !== "waiting") {
    return (
      <div className="space-y-4 text-center">
        <p>This game is no longer waiting for players.</p>
        <button
          type="button"
          onClick={() => navigate(`/game/${game._id}`)}
          className="rounded bg-amber-600 px-4 py-2 text-stone-950"
        >
          View game
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-stone-800 bg-[#121218] p-6">
      <h1 className="text-xl font-semibold text-amber-400">Join chess game</h1>
      {isAuthenticated ? (
        <button
          type="button"
          onClick={() => void onJoin()}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950"
        >
          Join as {game.whiteUserId ? "black" : "player"}
        </button>
      ) : (
        <form onSubmit={(e) => void onJoin(e)} className="space-y-3">
          <p className="text-sm text-stone-400">
            Play anonymously — no account required. You can sign up later to save your
            profile.
          </p>
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your display name"
            className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950"
          >
            Join game
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
