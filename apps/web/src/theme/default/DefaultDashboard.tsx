import { Link } from "react-router-dom";
import { LiveGamesCarousel } from "@/components/LiveGamesCarousel";
import { PrivateGameToggle } from "@/components/PrivateGameToggle";
import { QuickPairGrid } from "@/components/QuickPairGrid";
import { CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";
import type { DashboardController } from "@/hooks/useDashboardController";

export function DefaultDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return (
      <p className="default-mono text-[var(--default-mist)]">Loading observatory…</p>
    );
  }
  const u = ctrl.user;

  return (
    <div className="space-y-6">
      <section className="default-panel default-panel--accent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="default-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--default-ember-dim)]">
              Welcome back
            </p>
            <h1 className="default-display mt-2 text-3xl">
              {u.displayName ?? u.name ?? "Player"}
            </h1>
            <p className="default-mono mt-2 text-sm text-[var(--default-mist)]">
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
          <div className="text-right">
            <div className="default-display text-4xl text-[var(--default-ember)]">
              {u.rating ?? 1200}
            </div>
            <div className="default-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--default-mist)]">
              Elo
            </div>
          </div>
        </div>
      </section>

      {ctrl.correspondenceGames && ctrl.correspondenceGames.length > 0 && (
        <section className="default-panel p-4">
          <h2 className="default-display text-lg text-[var(--default-ember)]">
            Correspondence games
          </h2>
          <ul className="mt-3 space-y-2">
            {ctrl.correspondenceGames.map((g) => {
              const isMyTurn =
                g.status === "active" &&
                ((g.currentTurn === "white" && g.whiteUserId === u._id) ||
                  (g.currentTurn === "black" && g.blackUserId === u._id));
              return (
                <li key={g._id}>
                  <Link
                    to={`/game/${g._id}`}
                    className={`default-list-item block ${isMyTurn ? "default-list-item--active" : ""}`}
                  >
                    <span className="capitalize">{g.status}</span>
                    {g.daysPerTurn ? ` · ${g.daysPerTurn}d/turn` : ""} ·{" "}
                    {ctrl.formatCorrespondenceDeadline(g)}
                    {isMyTurn && (
                      <span className="default-mono ml-2 text-xs text-[var(--default-ember)]">
                        Your turn
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ctrl.liveActiveGames && ctrl.liveActiveGames.length > 0 && (
        <section className="default-panel p-4">
          <h2 className="default-display text-lg">Live games</h2>
          <ul className="mt-3 space-y-2">
            {ctrl.liveActiveGames.map((g) => (
              <li key={g._id}>
                <Link to={`/game/${g._id}`} className="default-list-item block">
                  {g.timeControlCategory ?? "live"} · {g.status}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctrl.myTurnGames && ctrl.myTurnGames.length > 0 && (
        <section className="default-panel default-panel--accent p-4">
          <h2 className="default-display text-lg text-[var(--default-ember)]">Your turn</h2>
          <ul className="mt-3 space-y-2">
            {ctrl.myTurnGames.map((g) => (
              <li key={g._id}>
                <Link to={`/game/${g._id}`} className="default-list-item block">
                  {g.playType === "correspondence" ? "Correspondence" : "Live"} game ·{" "}
                  {g.timeControlCategory ?? "untimed"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctrl.pendingInvites && ctrl.pendingInvites.length > 0 && (
        <section className="default-panel default-panel--accent p-4">
          <h2 className="default-display text-lg text-[var(--default-ember)]">Game invites</h2>
          <ul className="mt-3 space-y-2">
            {ctrl.pendingInvites.map(({ invite, fromUser, game }) => (
              <li
                key={invite._id}
                className="default-list-item flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  Challenge from{" "}
                  <strong>{fromUser?.displayName ?? fromUser?.name ?? "Player"}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void ctrl
                        .acceptInvite({ inviteId: invite._id })
                        .then((gameId) => ctrl.navigate(`/game/${gameId}`))
                    }
                    className="default-btn default-btn--primary text-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void ctrl.declineInvite({ inviteId: invite._id })}
                    className="default-btn default-btn--ghost text-sm"
                  >
                    Decline
                  </button>
                  {game && (
                    <Link
                      to={`/game/${game._id}`}
                      className="default-mono self-center text-sm text-[var(--default-mist)] hover:text-[var(--default-ember)]"
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
        <section className="default-panel space-y-4 p-4">
          <div className="default-tabs flex flex-wrap gap-2">
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
                className="default-tab"
                data-active={ctrl.tab === id ? "true" : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          {ctrl.tab === "quickPair" && (
            <div className="space-y-3">
              {ctrl.seeking && (
                <p className="default-mono text-sm text-[var(--default-ember)]">
                  Searching for opponent…{" "}
                  <button type="button" onClick={ctrl.stopSeeking} className="underline">
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
              <label className="block">
                <span className="default-mono text-sm text-[var(--default-mist)]">
                  Engine difficulty (1–20)
                </span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={ctrl.difficulty}
                  onChange={(e) => ctrl.setDifficulty(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
              <QuickPairGrid onSelect={(p) => void ctrl.onComputer(p)} />
            </div>
          )}

          {ctrl.tab === "correspondence" && (
            <div className="space-y-3">
              <label className="block">
                <span className="default-mono text-sm text-[var(--default-mist)]">
                  Days per turn
                </span>
                <select
                  value={ctrl.daysPerTurn}
                  onChange={(e) => ctrl.setDaysPerTurn(Number(e.target.value))}
                  className="default-input mt-1"
                >
                  {CORRESPONDENCE_DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? "No timer" : `${d} day${d === 1 ? "" : "s"}`}
                    </option>
                  ))}
                </select>
              </label>
              <p className="default-mono text-xs text-[var(--default-mist)]">
                Challenge an online friend below or create an invite link.
              </p>
            </div>
          )}

          {(ctrl.tab === "correspondence" || ctrl.tab === "quickPair") && (
            <div className="default-panel default-panel--inset pt-2">
              <p className="default-mono mb-2 text-xs text-[var(--default-mist)]">
                Optional time preset for friend challenges / invite links
              </p>
              <QuickPairGrid
                onSelect={(p) => ctrl.setSelectedPreset(p)}
                disabled={false}
              />
              {ctrl.selectedPreset && (
                <p className="default-mono mt-2 text-xs text-[var(--default-ember-dim)]">
                  Selected: {ctrl.selectedPreset.label}
                </p>
              )}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="default-panel p-4">
            <h2 className="default-display text-lg text-[var(--default-ember)]">Sidebar</h2>
            <div className="mt-3 space-y-2">
              {ctrl.tab !== "quickPair" && (
                <PrivateGameToggle
                  isPublic={ctrl.isPublic}
                  onChange={ctrl.setIsPublic}
                  labelClassName="default-mono text-xs text-[var(--default-mist)]"
                />
              )}
              <button
                type="button"
                onClick={() => void ctrl.createInviteLink()}
                className="default-btn default-btn--ghost w-full"
              >
                Create invite link
              </button>
              {ctrl.inviteLink && (
                <p className="default-mono break-all text-xs text-[var(--default-mist)]">
                  Link copied: {ctrl.inviteLink}
                </p>
              )}
            </div>
          </section>

          <section className="default-panel p-4">
            <h2 className="default-display text-lg text-[var(--default-ember)]">
              Players online
            </h2>
            {!ctrl.presenceState && (
              <p className="default-mono mt-2 text-sm text-[var(--default-mist)]">
                Connecting…
              </p>
            )}
            {ctrl.onlineUsers?.length === 0 && ctrl.presenceState && (
              <p className="default-mono mt-2 text-sm text-[var(--default-mist)]">
                No other players online.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {ctrl.onlineUsers?.map((player) => (
                <li
                  key={player._id}
                  className="default-list-item flex items-center justify-between"
                >
                  <div>
                    <Link
                      to={`/player/${player._id}`}
                      className="font-medium hover:text-[var(--default-ember)]"
                    >
                      {player.displayName ?? player.name}
                    </Link>
                    <span className="default-mono ml-2 text-xs text-[var(--default-mist)]">
                      ({player.rating ?? 1200})
                    </span>
                  </div>
                  {player.inActiveGame ? (
                    <button
                      type="button"
                      disabled
                      className="default-btn default-btn--ghost cursor-not-allowed text-sm opacity-50"
                    >
                      Playing
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void ctrl.challengePlayer(player._id)}
                      className="default-btn default-btn--primary text-sm"
                    >
                      Challenge
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="default-panel p-4">
            <LiveGamesCarousel />
          </section>
        </div>
      </div>
    </div>
  );
}
