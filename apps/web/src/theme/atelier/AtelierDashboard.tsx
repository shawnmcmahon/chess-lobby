import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../../convex/_generated/api";
import { CancelWaitingGameButton } from "@/components/CancelWaitingGameButton";
import { ChessBoardView } from "@/components/ChessBoardView";
import { LookingForOpponentSection } from "@/components/LookingForOpponentSection";
import { PrivateGameToggle } from "@/components/PrivateGameToggle";
import type { DashboardController } from "@/hooks/useDashboardController";
import { TIME_CONTROL_PRESETS, CORRESPONDENCE_DAY_OPTIONS } from "@/lib/timeControl";

export function AtelierDashboard({ ctrl }: { ctrl: DashboardController }) {
  if (!ctrl.user) {
    return (
      <p className="atelier-smallcaps mt-12 text-center" style={{ color: "var(--atelier-brass)" }}>
        Loading the salon…
      </p>
    );
  }
  const u = ctrl.user;
  return (
    <div className="space-y-10 relative">
      <header className="relative text-center pb-2">
        <div className="atelier-rule mb-6">
          <span className="atelier-smallcaps">The salon · today</span>
        </div>
        <p
          className="atelier-display"
          style={{
            fontSize: "1.1rem",
            color: "var(--atelier-brass)",
            fontStyle: "italic",
          }}
        >
          Welcome back,
        </p>
        <h1
          className="atelier-display"
          style={{
            fontSize: "clamp(2.6rem, 6vw, 4.4rem)",
            fontWeight: 500,
            fontStyle: "normal",
            letterSpacing: "-0.01em",
            marginTop: 4,
          }}
        >
          {u.displayName ?? u.name ?? "Player"}
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
          <Datum label="Rating" value={u.rating ?? 1200} />
          <Datum label="Online" value={ctrl.lobbyCounts?.onlineCount ?? "—"} />
          <Datum label="In play" value={ctrl.lobbyCounts?.inPlayCount ?? "—"} />
          <Datum
            label="Your turn"
            value={ctrl.myTurnGames?.length ?? 0}
            accent={ctrl.myTurnGames && ctrl.myTurnGames.length > 0}
          />
        </div>
      </header>

      <LookingForOpponentSection
        theme="atelier"
        entries={ctrl.lookingForOpponent}
        loading={ctrl.quickPairLoading}
        onJoin={ctrl.onJoinLookingForOpponent}
        onCancel={ctrl.onCancelLookingForOpponent}
      />

      {ctrl.pendingInvites && ctrl.pendingInvites.length > 0 && (
        <section className="atelier-panel atelier-panel--parchment">
          <Corners />
          <div className="flex items-start gap-4">
            <span className="atelier-seal flex-none">!</span>
            <div className="flex-1">
              <div className="atelier-smallcaps" style={{ color: "var(--atelier-oxblood)" }}>
                Cartes d'invitation
              </div>
              <h2
                className="atelier-display"
                style={{
                  fontSize: "1.8rem",
                  fontStyle: "italic",
                  color: "var(--atelier-obsidian)",
                  marginTop: 2,
                }}
              >
                {ctrl.pendingInvites.length} challenger
                {ctrl.pendingInvites.length === 1 ? "" : "s"} at the door.
              </h2>
              <ul className="mt-4 space-y-2">
                {ctrl.pendingInvites.map(({ invite, fromUser, game }) => (
                  <li
                    key={invite._id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2"
                    style={{ borderBottom: "1px solid rgba(11,20,36,0.12)" }}
                  >
                    <span
                      className="atelier-display"
                      style={{
                        fontSize: "1.2rem",
                        color: "var(--atelier-obsidian)",
                      }}
                    >
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
                        className="atelier-btn"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void ctrl.declineInvite({ inviteId: invite._id })}
                        className="atelier-btn atelier-btn--oxblood"
                      >
                        Decline
                      </button>
                      {game && (
                        <Link
                          to={`/game/${game._id}`}
                          className="atelier-smallcaps hover:underline"
                          style={{ color: "var(--atelier-brass)", alignSelf: "center" }}
                        >
                          View game
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {ctrl.correspondenceGames && ctrl.correspondenceGames.length > 0 && (
        <section className="atelier-panel atelier-panel--parchment relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Correspondence
          </div>
          <h2
            className="atelier-display"
            style={{ fontSize: "1.8rem", fontStyle: "italic", marginTop: 4 }}
          >
            Letters awaiting reply
          </h2>
          <ul className="mt-4 space-y-2">
            {ctrl.correspondenceGames.map((g) => {
              const isMyTurn =
                g.status === "active" &&
                ((g.currentTurn === "white" && g.whiteUserId === u._id) ||
                  (g.currentTurn === "black" && g.blackUserId === u._id));
              return (
                <li key={g._id} className="flex items-center gap-2">
                  <Link
                    to={`/game/${g._id}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm px-2 py-2"
                    style={{
                      borderBottom: "1px solid rgba(11,20,36,0.12)",
                      background: isMyTurn ? "rgba(123,31,43,0.08)" : undefined,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "1.05rem",
                      }}
                    >
                      <span className="capitalize">{g.status}</span>
                      {g.daysPerTurn ? ` · ${g.daysPerTurn}d/turn` : ""} ·{" "}
                      {ctrl.formatCorrespondenceDeadline(g)}
                    </span>
                    {isMyTurn && (
                      <span
                        className="atelier-smallcaps"
                        style={{ color: "var(--atelier-oxblood)" }}
                      >
                        your turn
                      </span>
                    )}
                  </Link>
                  {ctrl.canCancelWaitingGame(g) && (
                    <CancelWaitingGameButton
                      gameId={g._id}
                      variant="icon"
                      theme="atelier"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ctrl.liveActiveGames && ctrl.liveActiveGames.length > 0 && (
        <section className="atelier-panel relative">
          <Corners />
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            Live play
          </div>
          <h2
            className="atelier-display"
            style={{ fontSize: "1.8rem", fontStyle: "italic", marginTop: 4 }}
          >
            Games on the clock
          </h2>
          <ul className="mt-4 space-y-2">
            {ctrl.liveActiveGames.map((g) => (
              <li key={g._id} className="flex items-center gap-2">
                <Link
                  to={`/game/${g._id}`}
                  className="flex min-w-0 flex-1 items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(194,162,88,0.16)" }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: "1.05rem",
                    }}
                  >
                    {g.timeControlCategory ?? "live"} · {g.status}
                  </span>
                  <span
                    className="atelier-smallcaps"
                    style={{ color: "var(--atelier-brass)" }}
                  >
                    enter →
                  </span>
                </Link>
                {ctrl.canCancelWaitingGame(g) && (
                  <CancelWaitingGameButton
                    gameId={g._id}
                    variant="icon"
                    theme="atelier"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-12 gap-6">
        <section className="atelier-panel col-span-12 lg:col-span-7 relative">
          <Corners />
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2
              className="atelier-display"
              style={{ fontSize: "1.9rem", fontStyle: "italic" }}
            >
              The board awaits.
            </h2>
            <div className="flex gap-3">
              {(
                [
                  ["quickPair", "Pair"],
                  ["friendChallenge", "Friend"],
                  ["computer", "Machine"],
                  ["correspondence", "Post"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => ctrl.setTab(id)}
                  className="atelier-smallcaps"
                  style={{
                    padding: "6px 14px",
                    border: "1px solid var(--atelier-brass-dim)",
                    color:
                      ctrl.tab === id
                        ? "var(--atelier-obsidian)"
                        : "var(--atelier-brass)",
                    background:
                      ctrl.tab === id ? "var(--atelier-brass)" : "transparent",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {ctrl.tab === "quickPair" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
              {TIME_CONTROL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={ctrl.quickPairLoading}
                  onClick={() => void ctrl.onQuickPair(p)}
                  className="atelier-preset"
                  style={presetStyle}
                >
                  <div className="atelier-display" style={{ fontSize: "1.4rem", fontStyle: "italic", color: "var(--atelier-parchment)" }}>
                    {p.label}
                  </div>
                </button>
              ))}
            </div>
          )}

          {ctrl.tab === "computer" && (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                  Machine difficulty — {ctrl.difficulty} of 20
                </span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={ctrl.difficulty}
                  onChange={(e) => ctrl.setDifficulty(Number(e.target.value))}
                  className="mt-2 w-full"
                  style={{ accentColor: "var(--atelier-brass)" }}
                />
              </label>
              {ctrl.showPrivateGameToggle && (
                <PrivateGameToggle
                  isPublic={ctrl.isPublic}
                  onChange={ctrl.setIsPublic}
                  labelClassName="atelier-smallcaps"
                />
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {TIME_CONTROL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => void ctrl.onComputer(p)}
                    style={presetStyle}
                  >
                    <div
                      className="atelier-display"
                      style={{
                        fontSize: "1.4rem",
                        fontStyle: "italic",
                        color: "var(--atelier-parchment)",
                      }}
                    >
                      {p.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {ctrl.tab === "friendChallenge" && (
            <div className="mt-5 space-y-3">
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--atelier-parchment-soft)",
                }}
              >
                Choose a live cadence, then summon a player or post a sealed invitation.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {TIME_CONTROL_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => ctrl.setSelectedPreset(p)}
                    style={{
                      ...presetStyle,
                      borderColor:
                        ctrl.selectedPreset?.label === p.label
                          ? "var(--atelier-brass)"
                          : "var(--atelier-brass-dim)",
                      background:
                        ctrl.selectedPreset?.label === p.label
                          ? "rgba(194,162,88,0.16)"
                          : presetStyle.background,
                    }}
                  >
                    <div
                      className="atelier-display"
                      style={{
                        fontSize: "1.2rem",
                        fontStyle: "italic",
                        color: "var(--atelier-parchment)",
                      }}
                    >
                      {p.label}
                    </div>
                  </button>
                ))}
              </div>
              {ctrl.selectedPreset && (
                <p
                  className="atelier-smallcaps mt-3"
                  style={{ color: "var(--atelier-brass)" }}
                >
                  Inscribed · {ctrl.selectedPreset.label}
                </p>
              )}
            </div>
          )}

          {ctrl.tab === "correspondence" && (
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
                  Days per turn
                </span>
                <select
                  value={ctrl.daysPerTurn}
                  onChange={(e) => ctrl.setDaysPerTurn(Number(e.target.value))}
                  className="atelier-select mt-2"
                >
                  {CORRESPONDENCE_DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? "No timer" : `${d} day${d === 1 ? "" : "s"}`}
                    </option>
                  ))}
                </select>
              </label>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--atelier-parchment-soft)",
                }}
              >
                Set days per turn, then summon a player from the roster or post a sealed
                invitation.
              </p>
            </div>
          )}

          {ctrl.canInviteOrChallenge && (
            <PrivateGameToggle
              isPublic={ctrl.isPublic}
              onChange={ctrl.setIsPublic}
              className="mt-6"
              labelClassName="atelier-smallcaps"
            />
          )}

          {ctrl.canInviteOrChallenge ? (
            <>
              <div className="atelier-rule mt-6">
                <span className="atelier-smallcaps">Invitation by post</span>
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => void ctrl.createInviteLink()}
                  className="atelier-btn atelier-btn--ghost"
                >
                  Sealed link
                </button>
                {ctrl.inviteLink && (
                  <code
                    className="atelier-mono"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--atelier-brass)",
                      wordBreak: "break-all",
                    }}
                  >
                    {ctrl.inviteLink}
                  </code>
                )}
              </div>
            </>
          ) : (
            <p
              className="atelier-smallcaps mt-6"
              style={{ color: "var(--atelier-parchment-soft)" }}
            >
              Open Friend or Post to create an invite link.
            </p>
          )}
        </section>

        <aside className="col-span-12 lg:col-span-5 space-y-6">
          <section className="atelier-panel relative">
            <Corners />
            <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              The roster
            </div>
            <h3
              className="atelier-display"
              style={{ fontSize: "1.6rem", fontStyle: "italic", marginTop: 4 }}
            >
              At the salon now
            </h3>
            {!ctrl.presenceState && (
              <p
                className="mt-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--atelier-parchment-soft)",
                }}
              >
                Connecting…
              </p>
            )}
            {ctrl.onlineUsers?.length === 0 && ctrl.presenceState && (
              <p
                className="mt-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--atelier-parchment-soft)",
                }}
              >
                The salon is empty — yours to claim.
              </p>
            )}
            <ul className="mt-3 space-y-1">
              {ctrl.onlineUsers?.slice(0, 7).map((p) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between gap-3 py-2"
                  style={{ borderBottom: "1px solid rgba(194,162,88,0.16)" }}
                >
                  <Link
                    to={`/player/${p._id}`}
                    className="atelier-display flex items-baseline gap-3"
                    style={{
                      fontSize: "1.15rem",
                      fontStyle: "italic",
                      color: "var(--atelier-parchment)",
                    }}
                  >
                    {p.displayName ?? p.name}
                    <span
                      className="atelier-mono"
                      style={{ fontSize: "0.72rem", color: "var(--atelier-brass)" }}
                    >
                      {p.rating ?? 1200}
                    </span>
                  </Link>
                  {p.inActiveGame ? (
                    <span
                      className="atelier-smallcaps"
                      style={{ color: "var(--atelier-brass-dim)" }}
                    >
                      engaged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void ctrl.challengePlayer(p._id)}
                      className="atelier-btn atelier-btn--ghost"
                      style={{ padding: "6px 14px", fontSize: "0.65rem" }}
                    >
                      Invite
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {ctrl.myTurnGames && ctrl.myTurnGames.length > 0 && (
            <section
              className="atelier-panel relative"
              style={{
                background: "linear-gradient(180deg, rgba(123,31,43,0.35), rgba(11,20,36,0.6))",
                borderColor: "var(--atelier-oxblood)",
              }}
            >
              <Corners />
              <div className="atelier-smallcaps" style={{ color: "var(--atelier-oxblood)" }}>
                Your move
              </div>
              <h3
                className="atelier-display mt-1"
                style={{ fontSize: "1.6rem", fontStyle: "italic" }}
              >
                {ctrl.myTurnGames.length} board
                {ctrl.myTurnGames.length === 1 ? "" : "s"} waiting
              </h3>
              <ul className="mt-3 space-y-2">
                {ctrl.myTurnGames.map((g) => (
                  <li key={g._id}>
                    <Link
                      to={`/game/${g._id}`}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: "1px solid rgba(194,162,88,0.16)" }}
                    >
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontStyle: "italic",
                          fontSize: "1.05rem",
                        }}
                      >
                        {g.playType === "correspondence" ? "Correspondence" : "Live"} ·{" "}
                        {g.timeControlCategory ?? "untimed"}
                      </span>
                      <span
                        className="atelier-smallcaps"
                        style={{ color: "var(--atelier-brass)" }}
                      >
                        play →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="atelier-panel relative">
            <Corners />
            <AtelierLiveSpectate />
          </section>
        </aside>
      </div>
    </div>
  );
}

function AtelierLiveSpectate() {
  const liveGames = useQuery(api.games.listActiveForSpectate, { limit: 20 });
  const [index, setIndex] = useState(0);

  if (!liveGames || liveGames.length === 0) {
    return (
      <>
        <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
          The gallery
        </div>
        <h3
          className="atelier-display"
          style={{ fontSize: "1.6rem", fontStyle: "italic", marginTop: 4 }}
        >
          Observe from the balcony
        </h3>
        <p
          className="mt-3"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "var(--atelier-parchment-soft)",
          }}
        >
          No live games to spectate at the moment.
        </p>
      </>
    );
  }

  const current = liveGames[index % liveGames.length];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
            The gallery
          </div>
          <h3
            className="atelier-display"
            style={{ fontSize: "1.6rem", fontStyle: "italic", marginTop: 4 }}
          >
            Observe from the balcony
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + liveGames.length) % liveGames.length)
            }
            className="atelier-smallcaps"
            style={{
              padding: "4px 10px",
              border: "1px solid var(--atelier-brass-dim)",
              color: "var(--atelier-brass)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <span className="atelier-mono text-[0.72rem]" style={{ color: "var(--atelier-brass)" }}>
            {(index % liveGames.length) + 1} / {liveGames.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % liveGames.length)}
            className="atelier-smallcaps"
            style={{
              padding: "4px 10px",
              border: "1px solid var(--atelier-brass-dim)",
              color: "var(--atelier-brass)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>
      <Link
        to={`/game/${current.game._id}?spectate=1`}
        className="mt-4 block rounded-sm p-3"
        style={{
          border: "1px solid rgba(194,162,88,0.2)",
          background: "rgba(11,20,36,0.35)",
        }}
      >
        <p
          className="atelier-display"
          style={{ fontSize: "1.15rem", fontStyle: "italic" }}
        >
          {current.whiteName}{" "}
          <span style={{ color: "var(--atelier-brass)", fontSize: "0.95rem" }}>vs</span>{" "}
          {current.blackName}
        </p>
        <div className="pointer-events-none origin-top-left scale-75">
          <ChessBoardView fen={current.game.fen} readOnly allowDrawingArrows />
        </div>
        <p
          className="atelier-smallcaps mt-1 capitalize"
          style={{ color: "var(--atelier-brass-dim)" }}
        >
          {current.game.timeControlCategory ?? "live"} · click to spectate
        </p>
      </Link>
    </>
  );
}

const presetStyle = {
  padding: 18,
  textAlign: "center" as const,
  background: "rgba(11, 20, 36, 0.6)",
  border: "1px solid var(--atelier-brass-dim)",
  borderRadius: 2,
  cursor: "pointer",
};

function Datum({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className="atelier-display"
        style={{
          fontSize: "2.4rem",
          lineHeight: 1,
          fontWeight: 500,
          fontFeatureSettings: "'tnum'",
          color: accent ? "var(--atelier-oxblood)" : "var(--atelier-parchment)",
        }}
      >
        {value}
      </div>
      <div
        className="atelier-smallcaps mt-1"
        style={{ color: "var(--atelier-brass)" }}
      >
        {label}
      </div>
    </div>
  );
}

function Corners() {
  return (
    <>
      <span className="atelier-panel__corner atelier-panel__corner--tl" />
      <span className="atelier-panel__corner atelier-panel__corner--tr" />
      <span className="atelier-panel__corner atelier-panel__corner--bl" />
      <span className="atelier-panel__corner atelier-panel__corner--br" />
    </>
  );
}
