import { Link } from "react-router-dom";
import type { DashboardController } from "@/hooks/useDashboardController";
import { TIME_CONTROL_PRESETS, CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";

export function BrutalDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING…
      </p>
    );
  }
  const u = ctrl.user;
  return (
    <div className="space-y-6">
      <section
        className="brutal-card brutal-card--ink relative"
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
            {ctrl.pendingInvites.map(({ invite, fromUser }) => (
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
                </div>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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

      {ctrl.activeGames && ctrl.activeGames.length > 0 && (
        <section className="brutal-card relative" style={{ padding: 22 }}>
          <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 32 }}>
            ★ NEWSDESK
          </span>
          <h2 className="brutal-display" style={{ fontSize: "1.3rem" }}>
            ALL YOUR GAMES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {ctrl.activeGames.map((g) => (
              <Link
                key={g._id}
                to={`/game/${g._id}`}
                className="brutal-card brutal-card--paper flex items-center justify-between"
                style={{ padding: 12, boxShadow: "4px 4px 0 var(--brutal-ink)" }}
              >
                <span className="brutal-chunk text-[0.95rem]">
                  {g.timeControlCategory ?? g.playType ?? "live"} ·{" "}
                  <span style={{ color: "var(--brutal-magenta)" }}>{g.status}</span>
                </span>
                <span className="brutal-display text-[0.85rem]">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
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
    <div className={`brutal-card ${v}`} style={{ padding: "8px 14px", boxShadow: "3px 3px 0 var(--brutal-ink)" }}>
      <div className="brutal-display" style={{ fontSize: "0.65rem" }}>{label}</div>
      <div className="brutal-chunk" style={{ fontSize: "1.6rem", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
