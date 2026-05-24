import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../../convex/_generated/api";
import { ChessBoardView } from "@/components/ChessBoardView";
import { PrivateGameToggle } from "@/components/PrivateGameToggle";
import type { DashboardController } from "@/hooks/useDashboardController";
import { TIME_CONTROL_PRESETS, CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";

export function BentoDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return (
      <p className="bento-mono opacity-60" style={{ marginTop: 32 }}>
        Loading…
      </p>
    );
  }
  const u = ctrl.user;
  return (
    <div className="bento-grid">
      <section
        className="bento-tile bento-tile--ink col-span-12 lg:col-span-7"
        style={{ padding: 32, animationDelay: "0ms", minHeight: 220 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="bento-tile__eyebrow">Welcome back</div>
            <h1
              className="bento-tile__title"
              style={{ fontSize: "2.8rem", marginTop: 10 }}
            >
              {u.displayName ?? u.name ?? "Player"}
            </h1>
          </div>
          <div className="text-right">
            <div
              className="bento-tile__num"
              style={{ fontSize: "3rem", color: "var(--bento-paper)" }}
            >
              {u.rating ?? 1200}
            </div>
            <div className="bento-mono text-[0.7rem] opacity-60 uppercase tracking-widest">
              rating
            </div>
          </div>
        </div>
        <div className="bento-divider" />
        <div className="grid grid-cols-3 gap-6">
          <Stat
            value={ctrl.lobbyCounts?.onlineCount ?? "—"}
            label="online"
          />
          <Stat value={ctrl.lobbyCounts?.inPlayCount ?? "—"} label="in play" />
          <Stat
            value={ctrl.myTurnGames?.length ?? 0}
            label="your turn"
            accent={ctrl.myTurnGames && ctrl.myTurnGames.length > 0}
          />
        </div>
        <span className="bento-checker" aria-hidden />
      </section>

      <section
        className="bento-tile bento-tile--clay col-span-12 lg:col-span-5"
        style={{ padding: 28, animationDelay: "80ms" }}
      >
        <div className="bento-tile__eyebrow">Featured action</div>
        <h2
          className="bento-tile__title"
          style={{ fontSize: "2rem", marginTop: 10, maxWidth: "12ch" }}
        >
          Make a move <em>now</em>.
        </h2>
        <p className="bento-mono mt-3 text-[0.72rem] opacity-85" style={{ lineHeight: 1.6 }}>
          Pop a 5+0 game in under a minute, or hand-pick an opponent below.
        </p>
        <button
          type="button"
          disabled={ctrl.noOtherPlayersOnline}
          onClick={() =>
            void ctrl.onQuickPair({ label: "5+0", baseTimeMs: 300_000, incrementMs: 0 })
          }
          className="bento-btn disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            marginTop: 18,
            background: "var(--bento-ink)",
            color: "var(--bento-paper)",
          }}
        >
          Pair me · 5+0
        </button>
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-8"
        style={{ padding: 28, animationDelay: "160ms" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="bento-tile__eyebrow">New game</div>
            <h2
              className="bento-tile__title"
              style={{ fontSize: "1.6rem", marginTop: 6 }}
            >
              Pick a time, <em>start playing.</em>
            </h2>
          </div>
          <div className="bento-tabs">
            {(
              [
                ["quickPair", "Pair"],
                ["friendChallenge", "Friend"],
                ["computer", "Engine"],
                ["correspondence", "Corres."],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="bento-tab"
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
        </div>

        {ctrl.tab === "quickPair" && (
          <>
            {ctrl.noOtherPlayersOnline && (
              <p
                className="bento-mono mt-4 text-sm"
                style={{ color: "var(--bento-coral, #e85d4c)" }}
              >
                Nobody else is online — quick pairing needs another player in the lobby.
              </p>
            )}
            {ctrl.seeking && (
              <div
                className="bento-mono mt-4 flex items-center gap-2 text-sm"
                style={{ color: "var(--bento-jade)" }}
              >
                <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--bento-jade)" }} />
                Searching for opponent…
                <button
                  type="button"
                  onClick={ctrl.stopSeeking}
                  className="underline decoration-dotted"
                >
                  cancel
                </button>
              </div>
            )}
            <div className="bento-preset-grid mt-5">
              {TIME_CONTROL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="bento-preset"
                  disabled={ctrl.seeking || ctrl.noOtherPlayersOnline}
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
              <span className="bento-mono text-[0.68rem] uppercase tracking-widest opacity-70">
                Engine difficulty · {ctrl.difficulty}
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
            {ctrl.showPrivateGameToggle && (
              <PrivateGameToggle
                isPublic={ctrl.isPublic}
                onChange={ctrl.setIsPublic}
                labelClassName="bento-mono text-[0.7rem] opacity-80"
              />
            )}
            <div className="bento-preset-grid">
              {TIME_CONTROL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="bento-preset"
                  onClick={() => void ctrl.onComputer(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {ctrl.tab === "friendChallenge" && (
          <div className="mt-5 space-y-3">
            <p className="bento-mono text-[0.7rem] opacity-60">
              Pick a live time control, then challenge someone or create an invite link.
            </p>
            <div className="bento-preset-grid">
              {TIME_CONTROL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="bento-preset"
                  data-active={
                    ctrl.selectedPreset?.label === p.label ? "true" : undefined
                  }
                  onClick={() => ctrl.setSelectedPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {ctrl.selectedPreset && (
              <p
                className="bento-mono text-[0.7rem]"
                style={{ color: "var(--bento-jade)" }}
              >
                ▸ {ctrl.selectedPreset.label} selected
              </p>
            )}
          </div>
        )}
        {ctrl.tab === "correspondence" && (
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="bento-mono text-[0.68rem] uppercase tracking-widest opacity-70">
                Days per turn
              </span>
              <select
                value={ctrl.daysPerTurn}
                onChange={(e) => ctrl.setDaysPerTurn(Number(e.target.value))}
                className="bento-select mt-2"
              >
                {CORRESPONDENCE_DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 0 ? "No timer" : `${d} day${d === 1 ? "" : "s"}`}
                  </option>
                ))}
              </select>
            </label>
            <p className="bento-mono text-[0.7rem] opacity-60">
              Set days per turn, then challenge someone or create an invite link.
            </p>
          </div>
        )}

        <div className="bento-divider" />
        {ctrl.canInviteOrChallenge && (
          <PrivateGameToggle
            isPublic={ctrl.isPublic}
            onChange={ctrl.setIsPublic}
            className="mb-3"
            labelClassName="bento-mono text-[0.7rem] opacity-80"
          />
        )}
        {ctrl.canInviteOrChallenge ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void ctrl.createInviteLink()}
              className="bento-btn bento-btn--ghost"
            >
              Create invite link
            </button>
            {ctrl.inviteLink && (
              <span className="bento-mono text-[0.7rem] opacity-60 break-all">
                copied · {ctrl.inviteLink}
              </span>
            )}
          </div>
        ) : (
          <p className="bento-mono text-[0.7rem] opacity-60">
            Open Friend or Corres. to create an invite link.
          </p>
        )}
      </section>

      <section
        className="bento-tile bento-tile--jade col-span-12 lg:col-span-4"
        style={{ padding: 24, animationDelay: "240ms" }}
      >
        <div className="bento-tile__eyebrow">Players online</div>
        <h3
          className="bento-tile__title"
          style={{ fontSize: "1.5rem", marginTop: 4 }}
        >
          The lobby <em>tonight</em>
        </h3>
        {!ctrl.presenceState && (
          <p className="bento-mono mt-3 text-[0.7rem] opacity-70">connecting…</p>
        )}
        {ctrl.onlineUsers?.length === 0 && ctrl.presenceState && (
          <p className="bento-mono mt-3 text-[0.7rem] opacity-70">
            nobody else here — be the first to start a game
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {ctrl.onlineUsers?.slice(0, 6).map((player) => (
            <li
              key={player._id}
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "rgba(245,241,234,0.12)" }}
            >
              <Link
                to={`/player/${player._id}`}
                className="bento-mono text-sm hover:underline"
              >
                {player.displayName ?? player.name}{" "}
                <span className="opacity-60">· {player.rating ?? 1200}</span>
              </Link>
              {player.inActiveGame ? (
                <span className="bento-mono text-[0.6rem] opacity-60 uppercase">
                  playing
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void ctrl.challengePlayer(player._id)}
                  className="bento-mono text-[0.7rem] uppercase tracking-widest"
                  style={{
                    background: "var(--bento-paper)",
                    color: "var(--bento-ink)",
                    padding: "5px 10px",
                    borderRadius: 8,
                  }}
                >
                  challenge
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {ctrl.pendingInvites && ctrl.pendingInvites.length > 0 && (
        <section
          className="bento-tile col-span-12 lg:col-span-6"
          style={{ padding: 24, animationDelay: "320ms", background: "#fff4ec" }}
        >
          <div className="bento-tile__eyebrow" style={{ color: "var(--bento-clay)" }}>
            ★ Incoming
          </div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            Challenges <em>for you</em>
          </h3>
          <ul className="mt-4 space-y-2">
            {ctrl.pendingInvites.map(({ invite, fromUser, game }) => (
              <li
                key={invite._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2"
                style={{ background: "rgba(14,14,16,0.04)" }}
              >
                <span className="bento-mono text-sm">
                  {fromUser?.displayName ?? fromUser?.name ?? "Player"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void ctrl
                        .acceptInvite({ inviteId: invite._id })
                        .then((gameId) => ctrl.navigate(`/game/${gameId}`))
                    }
                    className="bento-btn"
                    style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void ctrl.declineInvite({ inviteId: invite._id })}
                    className="bento-btn bento-btn--ghost"
                    style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                  >
                    Decline
                  </button>
                  {game && (
                    <Link
                      to={`/game/${game._id}`}
                      className="bento-mono text-[0.72rem] opacity-70 hover:underline"
                      style={{ alignSelf: "center" }}
                    >
                      View game
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
          className="bento-tile col-span-12 lg:col-span-6"
          style={{ padding: 24, animationDelay: "360ms" }}
        >
          <div className="bento-tile__eyebrow">Correspondence</div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            <em>Letters in play</em>
          </h3>
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
                    className="flex items-center justify-between rounded-xl px-3 py-2 bento-mono text-sm hover:bg-stone-100"
                    style={{
                      background: isMyTurn
                        ? "rgba(245, 176, 66, 0.12)"
                        : "rgba(14,14,16,0.04)",
                      border: isMyTurn ? "1px solid rgba(245, 176, 66, 0.35)" : undefined,
                    }}
                  >
                    <span>
                      <span className="capitalize">{g.status}</span>
                      {g.daysPerTurn ? ` · ${g.daysPerTurn}d/turn` : ""} ·{" "}
                      {ctrl.formatCorrespondenceDeadline(g)}
                    </span>
                    {isMyTurn && (
                      <span style={{ color: "var(--bento-jade)" }}>your turn →</span>
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
          className="bento-tile col-span-12 lg:col-span-6"
          style={{ padding: 24, animationDelay: "380ms" }}
        >
          <div className="bento-tile__eyebrow">Live games</div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            <em>On the clock</em>
          </h3>
          <ul className="mt-4 space-y-2">
            {ctrl.liveActiveGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bento-mono text-sm hover:bg-stone-100"
                  style={{ background: "rgba(14,14,16,0.04)" }}
                >
                  <span>
                    {g.timeControlCategory ?? "live"} · {g.status}
                  </span>
                  <span className="opacity-60">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctrl.myTurnGames && ctrl.myTurnGames.length > 0 && (
        <section
          className="bento-tile col-span-12 lg:col-span-6"
          style={{ padding: 24, animationDelay: "400ms" }}
        >
          <div className="bento-tile__eyebrow" style={{ color: "var(--bento-jade)" }}>
            Your move
          </div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            {ctrl.myTurnGames.length}{" "}
            <em>game{ctrl.myTurnGames.length === 1 ? "" : "s"} waiting</em>
          </h3>
          <ul className="mt-4 space-y-2">
            {ctrl.myTurnGames.map((g) => (
              <li key={g._id}>
                <Link
                  to={`/game/${g._id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bento-mono text-sm hover:bg-stone-100"
                  style={{ background: "rgba(14,14,16,0.04)" }}
                >
                  <span>
                    {g.playType === "correspondence" ? "Correspondence" : "Live"} ·{" "}
                    {g.timeControlCategory ?? "untimed"}
                  </span>
                  <span style={{ color: "var(--bento-jade)" }}>play →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="bento-tile col-span-12 lg:col-span-6"
        style={{
          padding: 24,
          animationDelay: "480ms",
          background: "var(--bento-paper)",
        }}
      >
        <BentoLiveSpectate />
      </section>
    </div>
  );
}

function BentoLiveSpectate() {
  const liveGames = useQuery(api.games.listActiveForSpectate, { limit: 20 });
  const [index, setIndex] = useState(0);

  if (!liveGames || liveGames.length === 0) {
    return (
      <>
        <div className="bento-tile__eyebrow">Live · spectate</div>
        <h3
          className="bento-tile__title"
          style={{ fontSize: "1.45rem", marginTop: 4 }}
        >
          <em>Boards in flight</em>
        </h3>
        <p className="bento-mono mt-3 text-[0.72rem] opacity-60">
          No live games to spectate right now.
        </p>
      </>
    );
  }

  const current = liveGames[index % liveGames.length];

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="bento-tile__eyebrow">Live · spectate</div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.45rem", marginTop: 4 }}
          >
            <em>Boards in flight</em>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + liveGames.length) % liveGames.length)
            }
            className="bento-mono rounded-lg px-2 py-0.5 text-xs"
            style={{ border: "1px solid rgba(14,14,16,0.12)" }}
          >
            ←
          </button>
          <span className="bento-mono px-2 text-[0.68rem] opacity-60">
            {(index % liveGames.length) + 1} / {liveGames.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % liveGames.length)}
            className="bento-mono rounded-lg px-2 py-0.5 text-xs"
            style={{ border: "1px solid rgba(14,14,16,0.12)" }}
          >
            →
          </button>
        </div>
      </div>
      <Link
        to={`/game/${current.game._id}?spectate=1`}
        className="mt-4 block rounded-2xl p-3 hover:bg-stone-100"
        style={{ background: "rgba(14,14,16,0.03)", border: "1px solid rgba(14,14,16,0.06)" }}
      >
        <p className="bento-mono text-sm">
          <span className="font-medium">{current.whiteName}</span>
          <span className="opacity-50"> vs </span>
          <span className="font-medium">{current.blackName}</span>
        </p>
        <div className="pointer-events-none origin-top-left scale-75">
          <ChessBoardView fen={current.game.fen} readOnly allowDrawingArrows />
        </div>
        <p className="bento-mono mt-1 text-[0.68rem] capitalize opacity-60">
          {current.game.timeControlCategory ?? "live"} · click to spectate
        </p>
      </Link>
    </>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className="bento-tile__num"
        style={{
          fontSize: "2.2rem",
          color: accent ? "#f5b042" : "var(--bento-paper)",
        }}
      >
        {value}
      </div>
      <div className="bento-mono text-[0.66rem] uppercase tracking-widest opacity-65">
        {label}
      </div>
    </div>
  );
}
