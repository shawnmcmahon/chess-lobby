import { Link } from "react-router-dom";
import { LiveGamesCarousel } from "@/components/LiveGamesCarousel";
import { QuickPairGrid } from "@/components/QuickPairGrid";
import { CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";
import {
  useDashboardController,
  type DashboardController,
} from "@/hooks/useDashboardController";
import { useTheme } from "@/theme/themeContext";
import { BentoDashboard } from "@/theme/bento/BentoDashboard";
import { BrutalDashboard } from "@/theme/brutal/BrutalDashboard";
import { AtelierDashboard } from "@/theme/atelier/AtelierDashboard";

export function Dashboard() {
  const ctrl = useDashboardController();
  const { theme } = useTheme();
  switch (theme) {
    case "bento":
      return <BentoDashboard ctrl={ctrl} />;
    case "brutal":
      return <BrutalDashboard ctrl={ctrl} />;
    case "atelier":
      return <AtelierDashboard ctrl={ctrl} />;
    default:
      return <DefaultDashboard ctrl={ctrl} />;
  }
}

function DefaultDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return <p className="text-stone-400">Loading…</p>;
  }
  const u = ctrl.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-amber-400">
          Welcome, {u.displayName ?? u.name ?? "Player"}
        </h1>
        <p className="text-sm text-stone-400">
          Rating {u.rating ?? 1200}
          {ctrl.lobbyCounts && (
            <>
              {" "}
              · {ctrl.lobbyCounts.onlineCount} online ·{" "}
              {ctrl.lobbyCounts.inPlayCount} in play
            </>
          )}
        </p>
      </div>

      {ctrl.correspondenceGames && ctrl.correspondenceGames.length > 0 && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-2 font-medium text-amber-400">Correspondence games</h2>
          <ul className="space-y-2">
            {ctrl.correspondenceGames.map((g) => {
              const isMyTurn =
                g.status === "active" &&
                ((g.currentTurn === "white" && g.whiteUserId === u._id) ||
                  (g.currentTurn === "black" && g.blackUserId === u._id));
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
                    {ctrl.formatCorrespondenceDeadline(g)}
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

      {ctrl.liveActiveGames && ctrl.liveActiveGames.length > 0 && (
        <section className="rounded-xl border border-stone-800 bg-[#121218] p-4">
          <h2 className="mb-2 font-medium text-stone-300">Live games</h2>
          <ul className="space-y-2">
            {ctrl.liveActiveGames.map((g) => (
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

      {ctrl.myTurnGames && ctrl.myTurnGames.length > 0 && (
        <section className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <h2 className="mb-2 font-medium text-amber-400">Your turn</h2>
          <ul className="space-y-2">
            {ctrl.myTurnGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="block rounded bg-stone-900/60 px-3 py-2 text-sm hover:bg-stone-900"
                >
                  {g.playType === "correspondence" ? "Correspondence" : "Live"} game ·{" "}
                  {g.timeControlCategory ?? "untimed"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctrl.pendingInvites && ctrl.pendingInvites.length > 0 && (
        <section className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <h2 className="mb-3 font-medium text-amber-400">Game invites</h2>
          <ul className="space-y-2">
            {ctrl.pendingInvites.map(({ invite, fromUser, game }) => (
              <li
                key={invite._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded bg-stone-900/60 px-3 py-2"
              >
                <span>
                  Challenge from{" "}
                  <strong>
                    {fromUser?.displayName ?? fromUser?.name ?? "Player"}
                  </strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void ctrl
                        .acceptInvite({ inviteId: invite._id })
                        .then((gameId) => ctrl.navigate(`/game/${gameId}`))
                    }
                    className="rounded bg-amber-600 px-3 py-1 text-sm text-stone-950"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void ctrl.declineInvite({ inviteId: invite._id })}
                    className="rounded border border-stone-600 px-3 py-1 text-sm"
                  >
                    Decline
                  </button>
                  {game && (
                    <Link
                      to={`/game/${game._id}`}
                      className="text-sm text-stone-400 hover:underline"
                    >
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
                  ctrl.setTab(id);
                  ctrl.stopSeeking();
                }}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  ctrl.tab === id
                    ? "bg-amber-600 text-stone-950"
                    : "border border-stone-700 hover:border-amber-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {ctrl.tab === "quickPair" && (
            <div className="space-y-3">
              {ctrl.seeking && (
                <p className="text-sm text-amber-300/90">
                  Searching for opponent…{" "}
                  <button
                    type="button"
                    onClick={ctrl.stopSeeking}
                    className="underline"
                  >
                    Cancel
                  </button>
                </p>
              )}
              <QuickPairGrid
                onSelect={(p) => void ctrl.onQuickPair(p)}
                disabled={ctrl.seeking}
              />
            </div>
          )}

          {ctrl.tab === "computer" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-stone-400">
                  Engine difficulty (1–20)
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={ctrl.difficulty}
                  onChange={(e) => ctrl.setDifficulty(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
              <QuickPairGrid onSelect={(p) => void ctrl.onComputer(p)} />
            </div>
          )}

          {ctrl.tab === "correspondence" && (
            <div className="space-y-3">
              <label className="text-sm text-stone-400">Days per turn</label>
              <select
                value={ctrl.daysPerTurn}
                onChange={(e) => ctrl.setDaysPerTurn(Number(e.target.value))}
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

          {(ctrl.tab === "correspondence" || ctrl.tab === "quickPair") && (
            <div className="pt-2">
              <p className="mb-2 text-xs text-stone-500">
                Optional time preset for friend challenges / invite links
              </p>
              <QuickPairGrid
                onSelect={(p) => ctrl.setSelectedPreset(p)}
                disabled={false}
              />
              {ctrl.selectedPreset && (
                <p className="mt-1 text-xs text-amber-400/80">
                  Selected: {ctrl.selectedPreset.label}
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
                onClick={() => void ctrl.createInviteLink()}
                className="w-full rounded-lg border border-stone-600 py-2 text-sm hover:border-amber-600"
              >
                Create invite link
              </button>
              {ctrl.inviteLink && (
                <p className="break-all text-xs text-stone-500">
                  Link copied: {ctrl.inviteLink}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-[#121218] p-4">
            <h2 className="mb-3 font-medium text-amber-400">Players online</h2>
            {!ctrl.presenceState && (
              <p className="text-sm text-stone-500">Connecting…</p>
            )}
            {ctrl.onlineUsers?.length === 0 && ctrl.presenceState && (
              <p className="text-sm text-stone-500">No other players online.</p>
            )}
            <ul className="space-y-2">
              {ctrl.onlineUsers?.map((player) => (
                <li
                  key={player._id}
                  className="flex items-center justify-between rounded bg-stone-900/60 px-3 py-2"
                >
                  <div>
                    <Link
                      to={`/player/${player._id}`}
                      className="font-medium hover:text-amber-300"
                    >
                      {player.displayName ?? player.name}
                    </Link>
                    <span className="ml-2 text-xs text-stone-500">
                      ({player.rating ?? 1200})
                    </span>
                  </div>
                  {player.inActiveGame ? (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded border border-stone-700 px-3 py-1 text-sm text-stone-500"
                    >
                      Playing
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void ctrl.challengePlayer(player._id)}
                      className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-stone-950 hover:bg-amber-500"
                    >
                      Challenge
                    </button>
                  )}
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
