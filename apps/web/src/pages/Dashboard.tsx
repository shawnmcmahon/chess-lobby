import usePresence from "@convex-dev/presence/react";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function Dashboard() {
  const user = useQuery(api.users.current);
  const pendingInvites = useQuery(api.invites.listPendingForMe);
  const sendInvite = useMutation(api.invites.send);
  const acceptInvite = useMutation(api.invites.accept);
  const declineInvite = useMutation(api.invites.decline);
  const createGame = useMutation(api.games.create);
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(10);

  const userId = user?._id ?? "";
  const presenceState = usePresence(
    api.presence,
    "lobby",
    userId,
    10000,
  );

  const onlineUserIds = useMemo(() => {
    if (!presenceState || !user) return [];
    return presenceState
      .filter((p) => p.online && p.userId !== user._id)
      .map((p) => p.userId as Id<"users">);
  }, [presenceState, user]);

  const onlineUsers = useQuery(
    api.users.listForLobby,
    onlineUserIds.length > 0 ? { userIds: onlineUserIds } : "skip",
  );

  async function challengePlayer(toUserId: Id<"users">) {
    const { gameId } = await sendInvite({ toUserId });
    navigate(`/game/${gameId}`);
  }

  async function playComputer() {
    const { gameId } = await createGame({
      mode: "human_vs_engine",
      engineDifficulty: difficulty,
    });
    navigate(`/game/${gameId}`);
  }

  async function createInviteLink() {
    const { gameId, inviteToken } = await createGame({ mode: "human_vs_human" });
    const url = `${window.location.origin}/game/join/${inviteToken}`;
    setInviteLink(url);
    await navigator.clipboard.writeText(url);
    navigate(`/game/${gameId}`);
  }

  if (!user) {
    return <p className="text-stone-400">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-amber-400">
          Welcome, {user.displayName ?? user.name ?? "Player"}
        </h1>
        <p className="text-stone-400">Rating {user.rating ?? 1200}</p>
      </div>

      {pendingInvites && pendingInvites.length > 0 && (
        <section className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <h2 className="mb-3 font-medium text-amber-400">Game invites</h2>
          <ul className="space-y-2">
            {pendingInvites.map(({ invite, fromUser, game }) => (
              <li
                key={invite._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded bg-stone-900/60 px-3 py-2"
              >
                <span>
                  Challenge from{" "}
                  <strong>{fromUser?.displayName ?? fromUser?.name ?? "Player"}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void acceptInvite({ inviteId: invite._id }).then((gameId) =>
                        navigate(`/game/${gameId}`),
                      )
                    }
                    className="rounded bg-amber-600 px-3 py-1 text-sm text-stone-950"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void declineInvite({ inviteId: invite._id })}
                    className="rounded border border-stone-600 px-3 py-1 text-sm"
                  >
                    Decline
                  </button>
                  {game && (
                    <Link to={`/game/${game._id}`} className="text-sm text-stone-400 hover:underline">
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-3 font-medium text-amber-400">Players online</h2>
          {!presenceState && <p className="text-sm text-stone-500">Connecting…</p>}
          {onlineUsers?.length === 0 && presenceState && (
            <p className="text-sm text-stone-500">No other players online right now.</p>
          )}
          <ul className="space-y-2">
            {onlineUsers?.map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between rounded bg-stone-900/60 px-3 py-2"
              >
                <div>
                  <span className="font-medium">{u.displayName ?? u.name}</span>
                  <span className="ml-2 text-xs text-stone-500">({u.rating ?? 1200})</span>
                </div>
                <button
                  type="button"
                  onClick={() => void challengePlayer(u._id)}
                  className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-stone-950 hover:bg-amber-500"
                >
                  Challenge
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="font-medium text-amber-400">Start a game</h2>

          <div>
            <label className="text-sm text-stone-400">Engine difficulty (1–20)</label>
            <input
              type="range"
              min={1}
              max={20}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <button
              type="button"
              onClick={() => void playComputer()}
              className="mt-2 w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950 hover:bg-amber-500"
            >
              Play vs computer
            </button>
          </div>

          <button
            type="button"
            onClick={() => void createInviteLink()}
            className="w-full rounded-lg border border-stone-600 py-2 hover:border-amber-600"
          >
            Create invite link (anonymous OK)
          </button>
          {inviteLink && (
            <p className="break-all text-xs text-stone-500">Link copied: {inviteLink}</p>
          )}
        </div>
      </section>
    </div>
  );
}
