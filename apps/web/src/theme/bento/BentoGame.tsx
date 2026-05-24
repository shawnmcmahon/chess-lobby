import { Link } from "react-router-dom";
import { GameAbortedBanner } from "@/components/GameAbortedBanner";
import { GameChat } from "@/components/GameChat";
import { GameDisconnectStatus } from "@/components/GameDisconnectStatus";
import { TurnIndicator } from "@/components/TurnIndicator";
import type { GameController } from "@/hooks/useGameController";
import { getGameChatProps } from "@/lib/gameChat";
import { BentoBoard } from "./BentoBoard";

export function BentoGame({ ctrl }: { ctrl: GameController }) {
  if (!ctrl.gameId) {
    return <p style={{ color: "var(--bento-clay)" }}>Missing game id.</p>;
  }
  if (ctrl.game === undefined) {
    return (
      <p className="bento-mono opacity-60" style={{ marginTop: 32 }}>
        Loading game…
      </p>
    );
  }
  if (!ctrl.game) {
    return (
      <p style={{ color: "var(--bento-clay)" }}>
        This game is private or could not be found.
      </p>
    );
  }
  const game = ctrl.game;
  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;
  const myColor = ctrl.spectate ? null : ctrl.myColor;

  return (
    <div className="bento-grid">
      <GameAbortedBanner
        theme="bento"
        status={game.status}
        endReason={game.endReason}
      />

      <div className="col-span-12 flex justify-end lg:hidden">
        <Link to="/dashboard" className="bento-btn bento-btn--ghost text-sm">
          ← Dashboard
        </Link>
      </div>

      <section
        className="bento-tile col-span-12 lg:col-span-8"
        style={{ padding: 20, animationDelay: "0ms" }}
      >
        <TurnIndicator
          theme="bento"
          currentTurn={game.currentTurn}
          myColor={myColor}
          spectate={ctrl.spectate}
          whiteName={ctrl.whiteName}
          blackName={ctrl.blackName}
          status={game.status}
          className="mb-4"
        />
        <BentoBoard
          game={game}
          myColor={myColor}
          isAuthenticated={ctrl.isAuthenticated}
          readOnly={ctrl.spectate}
        />
      </section>

      <section
        className="bento-tile col-span-12 lg:col-span-4"
        style={{ padding: 0, animationDelay: "80ms", background: "var(--bento-paper)" }}
      >
        <div className="px-5 pt-5">
          <div className="bento-tile__eyebrow">Table talk</div>
          <h3
            className="bento-tile__title"
            style={{ fontSize: "1.3rem", marginTop: 4 }}
          >
            <em>Chat</em>
          </h3>
        </div>
        <div className="px-2 pb-2 pt-3 min-h-[280px]" style={{ height: 380 }}>
          <GameChat {...getGameChatProps(ctrl, game)} />
        </div>
      </section>

      <section
        className="bento-tile bento-tile--ink col-span-12 hidden lg:col-span-8 lg:block"
        style={{ padding: 32, animationDelay: "160ms" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="bento-tile__eyebrow">Match</div>
            <h1
              className="bento-tile__title"
              style={{ fontSize: "2.2rem", marginTop: 6 }}
            >
              {ctrl.whiteName}{" "}
              <em style={{ opacity: 0.7 }}>vs</em>{" "}
              {ctrl.blackName}
            </h1>
            <p className="bento-mono mt-2 text-[0.72rem] uppercase tracking-widest opacity-60">
              {game.status} · {game.mode.replace(/_/g, " ")}
              {ctrl.spectate && " · spectating"}
              {!ctrl.spectate && ctrl.myColor && ` · you are ${ctrl.myColor}`}
            </p>
            {game.endReason?.startsWith("engine_error:") && (
              <p className="bento-mono mt-2 text-sm" style={{ color: "#ffb88a" }}>
                engine error · {game.endReason.replace(/^engine_error:\s*/, "")}
              </p>
            )}
            <GameDisconnectStatus
              game={game}
              myColor={ctrl.myColor}
              className="bento-mono mt-2 text-sm"
            />
          </div>
          <Link
            to="/dashboard"
            className="bento-btn bento-btn--ghost"
            style={{ color: "var(--bento-paper)", borderColor: "rgba(245,241,234,0.3)" }}
          >
            ← Dashboard
          </Link>
        </div>
      </section>

      <section
        className="bento-tile col-span-12 hidden lg:col-span-4 lg:block"
        style={{ padding: 24, animationDelay: "240ms", background: "var(--bento-bg)" }}
      >
        <div className="bento-tile__eyebrow">Position</div>
        <div className="bento-clock" style={{ marginTop: 8 }}>
          {parseInt(game.fen.split(" ")[5] ?? "1", 10) || 1}
          <span style={{ opacity: 0.35 }}>.</span>
        </div>
        <div className="bento-mono text-[0.7rem] opacity-60 uppercase tracking-widest">
          move
        </div>
        <div className="bento-divider" />
        <div className="bento-mono text-[0.72rem] opacity-75" style={{ lineHeight: 1.6 }}>
          <div>
            turn · <strong>{game.currentTurn}</strong>
          </div>
          <div>
            tc ·{" "}
            <strong>{game.timeControlCategory ?? game.playType ?? "live"}</strong>
          </div>
          {game.daysPerTurn && (
            <div>
              days · <strong>{game.daysPerTurn}</strong>
            </div>
          )}
        </div>
      </section>

      {game.status === "waiting" && (
        <section
          className="bento-tile bento-tile--clay col-span-12"
          style={{ padding: 22, animationDelay: "320ms" }}
        >
          <div className="bento-tile__eyebrow">Waiting room</div>
          <p
            className="bento-tile__title"
            style={{ fontSize: "1.3rem", marginTop: 4 }}
          >
            Share this link to start.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code
              className="bento-mono text-[0.78rem] px-3 py-2 rounded-xl"
              style={{ background: "rgba(0,0,0,0.18)", color: "#fff9f3" }}
            >
              {inviteUrl}
            </code>
            <button
              type="button"
              className="bento-btn"
              style={{ background: "var(--bento-ink)" }}
              onClick={() => void navigator.clipboard.writeText(inviteUrl)}
            >
              Copy link
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
