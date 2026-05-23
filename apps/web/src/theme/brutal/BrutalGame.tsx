import { Link } from "react-router-dom";
import { GameChat } from "@/components/GameChat";
import type { GameController } from "@/hooks/useGameController";
import { getGameChatProps } from "@/lib/gameChat";
import { BrutalBoard } from "./BrutalBoard";

export function BrutalGame({ ctrl }: { ctrl: GameController }) {
  if (!ctrl.gameId) {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ MISSING GAME ID
      </div>
    );
  }
  if (ctrl.game === undefined) {
    return (
      <p className="brutal-display" style={{ fontSize: "1.4rem", marginTop: 32 }}>
        LOADING…
      </p>
    );
  }
  if (!ctrl.game) {
    return (
      <div className="brutal-card brutal-card--magenta brutal-display" style={{ padding: 18 }}>
        ⚠ GAME NOT FOUND
      </div>
    );
  }
  const game = ctrl.game;
  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;

  return (
    <div className="space-y-6">
      <section
        className="brutal-card brutal-card--ink relative"
        style={{ padding: 24 }}
      >
        <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
          ★ MATCH
        </span>
        <span className="brutal-tape" style={{ position: "absolute", top: -14, right: 28 }}>
          {(game.status ?? "").toUpperCase()}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <div className="text-center md:text-right">
            <div className="brutal-display" style={{ fontSize: "0.85rem", color: "var(--brutal-magenta)" }}>
              ⬜ WHITE
            </div>
            <div className="brutal-display mt-1" style={{ fontSize: "2rem", lineHeight: 1 }}>
              {ctrl.whiteName.toUpperCase()}
            </div>
          </div>
          <div className="brutal-card brutal-card--yellow text-center" style={{ padding: 14, boxShadow: "4px 4px 0 var(--brutal-paper)" }}>
            <div className="brutal-chunk" style={{ fontSize: "1.5rem", lineHeight: 1 }}>
              VS
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="brutal-display" style={{ fontSize: "0.85rem", color: "var(--brutal-magenta)" }}>
              ⬛ BLACK
            </div>
            <div className="brutal-display mt-1" style={{ fontSize: "2rem", lineHeight: 1 }}>
              {ctrl.blackName.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="brutal-chunk mt-5 text-center" style={{ fontSize: "0.85rem", color: "var(--brutal-paper)" }}>
          {game.mode.replace(/_/g, " ")}{" "}
          {ctrl.spectate ? "· SPECTATING" : ctrl.myColor ? `· YOU ARE ${ctrl.myColor.toUpperCase()}` : ""}
        </div>
        {game.endReason?.startsWith("engine_error:") && (
          <div
            className="brutal-card brutal-card--magenta mt-4 brutal-display text-center"
            style={{ padding: 10, fontSize: "0.85rem" }}
          >
            ⚠ ENGINE ERROR · {game.endReason.replace(/^engine_error:\s*/, "").toUpperCase()}
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <Link to="/dashboard" className="brutal-btn brutal-btn--magenta">
            ← LOBBY
          </Link>
        </div>
      </section>

      {game.status === "waiting" && (
        <section
          className="brutal-card brutal-card--magenta relative"
          style={{ padding: 22 }}
          data-tilt="right"
        >
          <span className="brutal-sticker" style={{ top: -16, left: 24 }} data-tilt="left">
            INVITE
          </span>
          <h3 className="brutal-display" style={{ fontSize: "1.3rem" }}>
            SEND THIS LINK TO YOUR HOMIE
          </h3>
          <code
            className="brutal-card brutal-card--paper block mt-3"
            style={{ padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", boxShadow: "4px 4px 0 var(--brutal-ink)", wordBreak: "break-all" }}
          >
            {inviteUrl}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
            className="brutal-btn brutal-btn--ink mt-3"
          >
            ✂ COPY LINK
          </button>
        </section>
      )}

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8">
          <BrutalBoard
            game={game}
            myColor={ctrl.spectate ? null : ctrl.myColor}
            isAuthenticated={ctrl.isAuthenticated}
            readOnly={ctrl.spectate}
          />
        </section>
        <section
          className="brutal-card col-span-12 lg:col-span-4 relative"
          style={{ padding: 0, overflow: "hidden", minHeight: 380 }}
        >
          <div
            className="brutal-display"
            style={{
              padding: "14px 16px",
              background: "var(--brutal-ink)",
              color: "var(--brutal-yellow)",
              fontSize: "1.1rem",
              borderBottom: "var(--brutal-border) solid var(--brutal-ink)",
            }}
          >
            ★ TRASH TALK
          </div>
          <div style={{ height: 400 }}>
            <GameChat {...getGameChatProps(ctrl, game)} headerLabel="Trash talk" />
          </div>
        </section>
      </div>
    </div>
  );
}
