import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../../convex/_generated/api";
import { ChessBoardView } from "@/components/ChessBoardView";
import type { DashboardController } from "@/hooks/useDashboardController";
import { TIME_CONTROL_PRESETS, CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";

export function BrutalDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return <BrutalDashboardSkeleton />;
  }
  const u = ctrl.user;
  return (
    <div className="brutal-dashboard space-y-6">
      <section
        className="brutal-dashboard__player-section brutal-card brutal-card--ink relative"
        style={{ padding: 24 }}
      >
        <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
          PLAYER CARD
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 32 }}>
          ★ LIVE
        </span>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-center">
          <div>
            <div className="brutal-display" style={{ fontSize: "0.85rem", color: "var(--brutal-magenta)" }}>
              HELLO,
            </div>
            <h1 className="brutal-display mt-2" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>
              {(u.displayName ?? u.name ?? "PLAYER").toUpperCase()}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <Stat label="RATING" value={u.rating ?? 1200} variant="yellow" />
              <Stat
                label="ONLINE"
                value={ctrl.lobbyCounts?.onlineCount ?? "—"}
                variant="paper"
              />
              <Stat
                label="IN PLAY"
                value={ctrl.lobbyCounts?.inPlayCount ?? "—"}
                variant="paper"
              />
              <Stat
                label="YOUR TURN"
                value={ctrl.myTurnGames?.length ?? 0}
                variant="magenta"
              />
            </div>
          </div>
          <div
            className="brutal-card brutal-card--yellow text-center relative"
            data-tilt="right"
            style={{ padding: 18 }}
          >
            <div className="brutal-display" style={{ fontSize: "0.85rem" }}>
              QUICK FIGHT
            </div>
            <div
              className="brutal-chunk mt-2"
              style={{ fontSize: "3rem", lineHeight: 1 }}
            >
              5·0
            </div>
            <button
              type="button"
              className="brutal-btn brutal-btn--ink mt-3"
              onClick={() =>
                void ctrl.onQuickPair({
                  label: "5+0",
                  baseTimeMs: 300_000,
                  incrementMs: 0,
                })
              }
            >
              ▶ FIGHT NOW
            </button>
          </div>
        </div>
      </section>

      {ctrl.pendingInvites && ctrl.pendingInvites.length > 0 && (
        <section
          className="brutal-card brutal-card--magenta relative"
          style={{ padding: 22 }}
          data-tilt="left"
        >
          <span
            className="brutal-sticker"
            style={{ top: -16, right: 28 }}
            data-tilt="right"
          >
            ★ CHALLENGE
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.4rem" }}>
            {ctrl.pendingInvites.length} CHALLENGER{ctrl.pendingInvites.length === 1 ? "" : "S"} WAIT
          </h2>
          <ul className="mt-4 space-y-3">
            {ctrl.pendingInvites.map(({ invite, fromUser, game }) => (
              <li
                key={invite._id}
                className="brutal-card brutal-card--paper flex flex-wrap items-center justify-between gap-2"
                style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
              >
                <span className="brutal-display" style={{ fontSize: "1rem" }}>
                  {(fromUser?.displayName ?? fromUser?.name ?? "PLAYER").toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void ctrl
                        .acceptInvite({ inviteId: invite._id })
                        .then((gameId) => ctrl.navigate(`/game/${gameId}`))
                    }
                    className="brutal-btn brutal-btn--blue"
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    ✓ ACCEPT
                  </button>
                  <button
                    type="button"
                    onClick={() => void ctrl.declineInvite({ inviteId: invite._id })}
                    className="brutal-btn"
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    ✗ NOPE
                  </button>
                  {game && (
                    <Link
                      to={`/game/${game._id}`}
                      className="brutal-display hover:underline"
                      style={{ fontSize: "0.8rem", alignSelf: "center" }}
                    >
                      VIEW GAME
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctrl.correspondenceGames && ctrl.correspondenceGames.length > 0 && (
        <section
          className="brutal-card brutal-card--paper relative"
          style={{ padding: 22 }}
          data-tilt="left"
        >
          <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="right">
            POSTAL
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.4rem" }}>
            CORRESPONDENCE GAMES
          </h2>
          <ul className="mt-4 space-y-2">
            {ctrl.correspondenceGames.map((g) => {
              const isMyTurn =
                g.status === "active" &&
                ((g.currentTurn === "white" && g.whiteUserId === u._id) ||
                  (g.currentTurn === "black" && g.blackUserId === u._id));
              return (
                <li key={g._id}>
                  <Link
                    to={`/game/${g._id}`}
                    className="brutal-card flex items-center justify-between gap-2"
                    style={{
                      padding: 12,
                      boxShadow: "4px 4px 0 var(--brutal-ink)",
                      background: isMyTurn ? "var(--brutal-yellow)" : undefined,
                    }}
                  >
                    <span className="brutal-chunk text-[0.95rem]">
                      <span className="capitalize">{g.status}</span>
                      {g.daysPerTurn ? ` · ${g.daysPerTurn}D/TURN` : ""} ·{" "}
                      {ctrl.formatCorrespondenceDeadline(g).toUpperCase()}
                    </span>
                    {isMyTurn && (
                      <span className="brutal-display" style={{ fontSize: "0.8rem" }}>
                        YOUR TURN ▶
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
        <section
          className="brutal-card brutal-card--blue relative"
          style={{ padding: 22 }}
          data-tilt="right"
        >
          <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -16, right: 24 }} data-tilt="left">
            LIVE
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.4rem" }}>
            LIVE GAMES
          </h2>
          <ul className="mt-4 space-y-2">
            {ctrl.liveActiveGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="brutal-card brutal-card--paper flex items-center justify-between"
                  style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
                >
                  <span className="brutal-display" style={{ fontSize: "0.95rem" }}>
                    {(g.timeControlCategory ?? "LIVE").toUpperCase()} ·{" "}
                    {g.status.toUpperCase()}
                  </span>
                  <span className="brutal-display text-[0.85rem]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-12 gap-5">
        <section
          className="brutal-card col-span-12 lg:col-span-8 relative"
          style={{ padding: 22 }}
        >
          <span className="brutal-sticker" style={{ top: -16, left: 22 }} data-tilt="left">
            START A GAME
          </span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["quickPair", "PAIR"],
                ["computer", "CPU"],
                ["correspondence", "CORRES."],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="brutal-tab"
                data-active={ctrl.tab === id ? "true" : undefined}
                onClick={() => {
                  ctrl.setTab(id);
                  ctrl.stopSeeking();
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {ctrl.tab === "quickPair" && (
            <>
              {ctrl.seeking && (
                <div
                  className="brutal-card brutal-card--yellow mt-5 brutal-display flex items-center justify-between"
                  style={{ padding: 12, fontSize: "0.9rem" }}
                >
                  <span>↻ HUNTING OPPONENT…</span>
                  <button
                    type="button"
                    onClick={ctrl.stopSeeking}
                    className="brutal-btn brutal-btn--ink"
                    style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                  >
                    ✗ STOP
                  </button>
                </div>
              )}
              <div className="brutal-dashboard__game-grid grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
                {TIME_CONTROL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="brutal-preset"
                    disabled={ctrl.seeking}
                    onClick={() => void ctrl.onQuickPair(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {ctrl.tab === "computer" && (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="brutal-display text-[0.9rem]">
                  DIFFICULTY · {ctrl.difficulty}
                </span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={ctrl.difficulty}
                  onChange={(e) => ctrl.setDifficulty(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <div className="brutal-dashboard__game-grid grid grid-cols-3 sm:grid-cols-4 gap-3">
                {TIME_CONTROL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="brutal-preset"
                    onClick={() => void ctrl.onComputer(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ctrl.tab === "correspondence" && (
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="brutal-display text-[0.9rem]">DAYS PER TURN</span>
                <select
                  value={ctrl.daysPerTurn}
                  onChange={(e) => ctrl.setDaysPerTurn(Number(e.target.value))}
                  className="brutal-select mt-2"
                >
                  {CORRESPONDENCE_DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? "NO TIMER" : `${d} DAY${d === 1 ? "" : "S"}`}
                    </option>
                  ))}
                </select>
              </label>
              <p className="brutal-chunk text-[0.9rem]">
                Then challenge a player from the lobby strip below.
              </p>
            </div>
          )}

          {(ctrl.tab === "correspondence" || ctrl.tab === "quickPair") && (
            <div
              className="brutal-card brutal-card--yellow mt-5"
              style={{ padding: 14, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
            >
              <div className="brutal-display" style={{ fontSize: "0.8rem" }}>
                OPTIONAL PRESET FOR INVITES
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {TIME_CONTROL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="brutal-preset"
                    data-active={ctrl.selectedPreset?.label === p.label ? "true" : undefined}
                    onClick={() => ctrl.setSelectedPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {ctrl.selectedPreset && (
                <p className="brutal-display mt-2" style={{ fontSize: "0.85rem" }}>
                  ▸ {ctrl.selectedPreset.label} LOCKED IN
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void ctrl.createInviteLink()}
              className="brutal-btn brutal-btn--blue"
            >
              ✉ MAIL A LINK
            </button>
            {ctrl.inviteLink && (
              <span className="brutal-chunk text-[0.8rem] break-all">
                ★ COPIED → {ctrl.inviteLink}
              </span>
            )}
          </div>
        </section>

        <section
          className="brutal-card brutal-card--yellow col-span-12 lg:col-span-4 relative"
          style={{ padding: 22 }}
        >
          <span className="brutal-sticker brutal-sticker--magenta" style={{ top: -16, right: 16 }} data-tilt="right">
            ON DECK
          </span>
          <h3 className="brutal-display" style={{ fontSize: "1.3rem" }}>
            LOBBY ROSTER
          </h3>
          {!ctrl.presenceState && (
            <p className="brutal-chunk mt-3">CONNECTING…</p>
          )}
          {ctrl.onlineUsers?.length === 0 && ctrl.presenceState && (
            <p className="brutal-chunk mt-3">
              NOBODY HERE. BE THE BOSS.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {ctrl.onlineUsers?.slice(0, 6).map((p) => (
              <li
                key={p._id}
                className="flex items-center justify-between"
                style={{
                  borderBottom: "2px dashed var(--brutal-ink)",
                  paddingBottom: 8,
                }}
              >
                <Link
                  to={`/player/${p._id}`}
                  className="brutal-display hover:underline"
                  style={{ fontSize: "0.95rem" }}
                >
                  {(p.displayName ?? p.name ?? "?").toUpperCase()}{" "}
                  <span style={{ color: "var(--brutal-magenta)" }}>
                    ·{p.rating ?? 1200}
                  </span>
                </Link>
                {p.inActiveGame ? (
                  <span
                    className="brutal-display"
                    style={{ fontSize: "0.7rem", opacity: 0.7 }}
                  >
                    OCCUPIED
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void ctrl.challengePlayer(p._id)}
                    className="brutal-btn brutal-btn--magenta"
                    style={{ padding: "6px 10px", fontSize: "0.72rem" }}
                  >
                    FIGHT
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {ctrl.myTurnGames && ctrl.myTurnGames.length > 0 && (
        <section
          className="brutal-card brutal-card--blue relative"
          style={{ padding: 22 }}
          data-tilt="right"
        >
          <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
            ★ YOUR MOVE
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.6rem" }}>
            {ctrl.myTurnGames.length} BOARD{ctrl.myTurnGames.length === 1 ? "" : "S"} WAITING ON YOU
          </h2>
          <ul className="mt-4 space-y-2">
            {ctrl.myTurnGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="brutal-card brutal-card--paper flex items-center justify-between"
                  style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
                >
                  <span className="brutal-display" style={{ fontSize: "0.95rem" }}>
                    {(g.playType === "correspondence" ? "CORRESPONDENCE" : "LIVE")} ·{" "}
                    {(g.timeControlCategory ?? "UNTIMED").toUpperCase()}
                  </span>
                  <span className="brutal-display" style={{ fontSize: "0.95rem" }}>
                    PLAY ▶
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="brutal-dashboard__spectate brutal-card relative" style={{ padding: 22 }}>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 32 }}>
          ★ SPECTATE
        </span>
        <BrutalLiveSpectate />
      </section>
    </div>
  );
}

function BrutalLiveSpectate() {
  const liveGames = useQuery(api.games.listActiveForSpectate, { limit: 20 });
  const [index, setIndex] = useState(0);

  if (liveGames === undefined) {
    return (
      <>
        <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
          LIVE SPECTATOR FEED
        </h2>
        <div className="brutal-skeleton mt-4 h-48 w-full" />
      </>
    );
  }

  if (liveGames.length === 0) {
    return (
      <>
        <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
          LIVE SPECTATOR FEED
        </h2>
        <p className="brutal-chunk mt-3">NO LIVE GAMES TO WATCH RIGHT NOW.</p>
      </>
    );
  }

  const current = liveGames[index % liveGames.length];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
          LIVE SPECTATOR FEED
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + liveGames.length) % liveGames.length)
            }
            className="brutal-btn brutal-btn--ink"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
          >
            ←
          </button>
          <span className="brutal-display px-2" style={{ fontSize: "0.75rem" }}>
            {(index % liveGames.length) + 1}/{liveGames.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % liveGames.length)}
            className="brutal-btn brutal-btn--ink"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
          >
            →
          </button>
        </div>
      </div>
      <Link
        to={`/game/${current.game._id}?spectate=1`}
        className="brutal-card brutal-card--yellow mt-4 block"
        style={{ padding: 14, boxShadow: "6px 6px 0 var(--brutal-ink)" }}
      >
        <p className="brutal-display" style={{ fontSize: "1rem" }}>
          {current.whiteName.toUpperCase()}{" "}
          <span style={{ color: "var(--brutal-magenta)" }}>VS</span>{" "}
          {current.blackName.toUpperCase()}
        </p>
        <div className="pointer-events-none origin-top-left scale-75">
          <ChessBoardView fen={current.game.fen} readOnly allowDrawingArrows />
        </div>
        <p className="brutal-chunk mt-1 text-[0.85rem] capitalize">
          {(current.game.timeControlCategory ?? "live").toUpperCase()} · CLICK TO WATCH
        </p>
      </Link>
    </>
  );
}

function BrutalDashboardSkeleton() {
  return (
    <div className="brutal-dashboard space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <section
        className="brutal-dashboard__player-section brutal-card brutal-card--ink relative"
        style={{ padding: 24 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-center">
          <div className="space-y-4">
            <div className="brutal-skeleton h-4 w-24" />
            <div className="brutal-skeleton h-12 w-2/3 max-w-sm" />
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="brutal-card brutal-card--yellow"
                  style={{ padding: "8px 14px", width: 88, height: 56, boxShadow: "3px 3px 0 var(--brutal-ink)" }}
                />
              ))}
            </div>
          </div>
          <div
            className="brutal-card brutal-card--yellow"
            style={{ padding: 18, minHeight: 160, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
          />
        </div>
      </section>
      <div className="grid grid-cols-12 gap-5">
        <section className="brutal-card col-span-12 lg:col-span-8" style={{ padding: 22, minHeight: 320 }}>
          <div className="brutal-skeleton h-6 w-40" />
          <div className="brutal-dashboard__game-grid grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="brutal-skeleton h-12" />
            ))}
          </div>
        </section>
        <section className="brutal-card brutal-card--yellow col-span-12 lg:col-span-4" style={{ padding: 22, minHeight: 220 }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | string;
  variant: "yellow" | "magenta" | "paper";
}) {
  const v =
    variant === "yellow"
      ? "brutal-card--yellow"
      : variant === "magenta"
        ? "brutal-card--magenta"
        : "";
  return (
    <div className={`brutal-card brutal-stat ${v}`} style={{ padding: "8px 14px", boxShadow: "3px 3px 0 var(--brutal-ink)" }}>
      <div className="brutal-display brutal-stat__label" style={{ fontSize: "0.65rem" }}>{label}</div>
      <div className="brutal-chunk" style={{ fontSize: "1.6rem", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
