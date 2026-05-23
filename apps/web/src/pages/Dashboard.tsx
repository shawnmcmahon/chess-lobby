import usePresence from "@convex-dev/presence/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { LiveGamesCarousel } from "@/components/LiveGamesCarousel";
import { QuickPairGrid } from "@/components/QuickPairGrid";
import {
  CORRESPONDENCE_DAY_OPTIONS,
  type TimeControlPreset,
} from "@/lib/timeControl";

type PlayTab = "quickPair" | "computer" | "correspondence";

export function Dashboard() {
  const user = useQuery(api.users.current);
  const pendingInvites = useQuery(api.invites.listPendingForMe);
  const activeGames = useQuery(api.games.listMyActive);
  const mySeek = useQuery(api.seeks.getMySeek);
  const sendInvite = useMutation(api.invites.send);
  const acceptInvite = useMutation(api.invites.accept);
  const declineInvite = useMutation(api.invites.decline);
  const createGame = useMutation(api.games.create);
  const createSeek = useMutation(api.seeks.createSeek);
  const cancelSeek = useMutation(api.seeks.cancelSeek);
  const navigate = useNavigate();

  const [tab, setTab] = useState<PlayTab>("quickPair");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(10);
  const [seeking, setSeeking] = useState(false);
  const [daysPerTurn, setDaysPerTurn] = useState(3);
  const [selectedPreset, setSelectedPreset] = useState<TimeControlPreset | null>(null);

  const userId = user?._id ?? "";
  const presenceState = usePresence(api.presence, "lobby", userId, 10000);

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

  const lobbyCounts = useQuery(
    api.games.getLobbyCounts,
    presenceState ? { onlineCount: onlineUserIds.length + 1 } : "skip",
  );

  useEffect(() => {
    return () => {
      void cancelSeek({});
    };
  }, [cancelSeek]);

  useEffect(() => {
    if (mySeek) {
      setSeeking(true);
    }
  }, [mySeek]);

  async function onQuickPair(preset: TimeControlPreset) {
    setSeeking(true);
    const result = await createSeek({
      baseTimeMs: preset.baseTimeMs,
      incrementMs: preset.incrementMs,
    });
    if (result.matched && result.gameId) {
      setSeeking(false);
      navigate(`/game/${result.gameId}`);
    }
  }

  async function onComputer(preset: TimeControlPreset) {
    const { gameId } = await createGame({
      mode: "human_vs_engine",
      engineDifficulty: difficulty,
      playType: "live",
      baseTimeMs: preset.baseTimeMs,
      incrementMs: preset.incrementMs,
    });
    navigate(`/game/${gameId}`);
  }

  async function challengePlayer(toUserId: Id<"users">) {
    if (tab === "correspondence") {
      const { gameId } = await sendInvite({
        toUserId,
        playType: "correspondence",
        daysPerTurn: daysPerTurn > 0 ? daysPerTurn : undefined,
      });
      navigate(`/game/${gameId}`);
      return;
    }

    const preset = selectedPreset;
    const { gameId } = await sendInvite({
      toUserId,
      playType: "live",
      baseTimeMs: preset?.baseTimeMs,
      incrementMs: preset?.incrementMs,
    });
    navigate(`/game/${gameId}`);
  }

  async function createInviteLink() {
    const preset = selectedPreset;
    const { gameId, inviteToken } = await createGame({
      mode: "human_vs_human",
      playType: tab === "correspondence" ? "correspondence" : "live",
      baseTimeMs: preset?.baseTimeMs,
      incrementMs: preset?.incrementMs,
      daysPerTurn:
        tab === "correspondence" && daysPerTurn > 0 ? daysPerTurn : undefined,
    });
    const url = `${window.location.origin}/game/join/${inviteToken}`;
    setInviteLink(url);
    await navigator.clipboard.writeText(url);
    navigate(`/game/${gameId}`);
  }

  if (!user) {
    return <p className="text-stone-400">Loading…</p>;
  }

  const myTurnGames = activeGames?.filter(
    (g) =>
      g.status === "active" &&
      ((g.currentTurn === "white" && g.whiteUserId === user._id) ||
        (g.currentTurn === "black" && g.blackUserId === user._id)),
  );

  const correspondenceGames = activeGames?.filter(
    (g) =>
      g.playType === "correspondence" &&
      (g.status === "active" || g.status === "waiting"),
  );

  const liveActiveGames = activeGames?.filter(
    (g) =>
      g.playType !== "correspondence" &&
      (g.status === "active" || g.status === "waiting"),
  );

  function formatCorrespondenceDeadline(game: NonNullable<typeof activeGames>[number]) {
    if (!game.daysPerTurn || !game.turnDeadlineAt) return "No timer";
    const days = Math.ceil(Math.max(0, game.turnDeadlineAt - Date.now()) / 86_400_000);
    return days <= 0 ? "Deadline passed" : `${days} day${days === 1 ? "" : "s"} left`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-amber-400">
          Welcome, {user.displayName ?? user.name ?? "Player"}
        </h1>
        <p className="text-sm text-stone-400">
          Rating {user.rating ?? 1200}
          {lobbyCounts && (
            <>
              {" "}
              · {lobbyCounts.onlineCount} online · {lobbyCounts.inPlayCount} in
              play
            </>
          )}
        </p>
      </div>

      {correspondenceGames && correspondenceGames.length > 0 && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-2 font-medium text-amber-400">Correspondence games</h2>
          <ul className="space-y-2">
            {correspondenceGames.map((g) => {
              const isMyTurn =
                (g.currentTurn === "white" && g.whiteUserId === user._id) ||
                (g.currentTurn === "black" && g.blackUserId === user._id);
              return (
                <li key={g._id}>
                  <Link
                    to={`/game/${g._id}`}
                    className={`block rounded px-3 py-2 text-sm hover:bg-stone-900 ${
                      isMyTurn
                        ? "border border-amber-800/50 bg-amber-950/20"
                        : "bg-stone-900/60"
                    }`}
                  >
                    <span className="capitalize">{g.status}</span>
                    {g.daysPerTurn ? ` · ${g.daysPerTurn}d/turn` : ""} ·{" "}
                    {formatCorrespondenceDeadline(g)}
                    {isMyTurn && (
                      <span className="ml-2 text-xs text-amber-400">Your turn</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {liveActiveGames && liveActiveGames.length > 0 && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-2 font-medium text-stone-300">Live games</h2>
          <ul className="space-y-2">
            {liveActiveGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="block rounded bg-stone-900/60 px-3 py-2 text-sm hover:bg-stone-900"
                >
                  {g.timeControlCategory ?? "live"} · {g.status}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {myTurnGames && myTurnGames.length > 0 && (
        <section className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <h2 className="mb-2 font-medium text-amber-400">Your turn</h2>
          <ul className="space-y-2">
            {myTurnGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="block rounded bg-stone-900/60 px-3 py-2 text-sm hover:bg-stone-900"
                >
                  {g.playType === "correspondence" ? "Correspondence" : "Live"}{" "}
                  game · {g.timeControlCategory ?? "untimed"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-xl border border-stone-800 bg-[#121218] p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["quickPair", "Quick pairing"],
                ["computer", "Vs computer"],
                ["correspondence", "Correspondence"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  void cancelSeek({});
                  setSeeking(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === id
                    ? "bg-amber-600 text-stone-950"
                    : "border border-stone-700 hover:border-amber-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "quickPair" && (
            <div className="space-y-3">
              {seeking && (
                <p className="text-sm text-amber-300/90">
                  Searching for opponent…{" "}
                  <button
                    type="button"
                    onClick={() => {
                      void cancelSeek({});
                      setSeeking(false);
                    }}
                    className="underline"
                  >
                    Cancel
                  </button>
                </p>
              )}
              <QuickPairGrid onSelect={(p) => void onQuickPair(p)} disabled={seeking} />
            </div>
          )}

          {tab === "computer" && (
            <div className="space-y-3">
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
              </div>
              <QuickPairGrid onSelect={(p) => void onComputer(p)} />
            </div>
          )}

          {tab === "correspondence" && (
            <div className="space-y-3">
              <label className="text-sm text-stone-400">Days per turn</label>
              <select
                value={daysPerTurn}
                onChange={(e) => setDaysPerTurn(Number(e.target.value))}
                className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
              >
                {CORRESPONDENCE_DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "No timer" : `${d} day${d === 1 ? "" : "s"}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500">
                Challenge an online friend below or create an invite link.
              </p>
            </div>
          )}

          {(tab === "correspondence" || tab === "quickPair") && (
            <div className="pt-2">
              <p className="mb-2 text-xs text-stone-500">
                Optional time preset for friend challenges / invite links
              </p>
              <QuickPairGrid
                onSelect={(p) => setSelectedPreset(p)}
                disabled={false}
              />
              {selectedPreset && (
                <p className="mt-1 text-xs text-amber-400/80">
                  Selected: {selectedPreset.label}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-stone-800 bg-[#121218] p-4">
            <h2 className="mb-3 font-medium text-amber-400">Sidebar</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void createInviteLink()}
                className="w-full rounded-lg border border-stone-600 py-2 text-sm hover:border-amber-600"
              >
                Create invite link
              </button>
              {inviteLink && (
                <p className="break-all text-xs text-stone-500">Link copied: {inviteLink}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-[#121218] p-4">
            <h2 className="mb-3 font-medium text-amber-400">Players online</h2>
            {!presenceState && <p className="text-sm text-stone-500">Connecting…</p>}
            {onlineUsers?.length === 0 && presenceState && (
              <p className="text-sm text-stone-500">No other players online.</p>
            )}
            <ul className="space-y-2">
              {onlineUsers?.map((u) => (
                <li
                  key={u._id}
                  className="flex items-center justify-between rounded bg-stone-900/60 px-3 py-2"
                >
                  <div>
                    <Link to={`/player/${u._id}`} className="font-medium hover:text-amber-300">
                      {u.displayName ?? u.name}
                    </Link>
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

          <div className="rounded-xl border border-stone-800 bg-[#121218] p-4">
            <LiveGamesCarousel />
          </div>
        </div>
      </div>
    </div>
  );
}
