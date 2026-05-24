import { Link } from "react-router-dom";
import { GameAbortedBanner } from "@/components/GameAbortedBanner";
import { GameChat } from "@/components/GameChat";
import { GameDisconnectStatus } from "@/components/GameDisconnectStatus";
import { TurnIndicator } from "@/components/TurnIndicator";
import type { GameController } from "@/hooks/useGameController";
import { getGameChatProps } from "@/lib/gameChat";
import { AtelierBoard } from "./AtelierBoard";

export function AtelierGame({ ctrl }: { ctrl: GameController }) {
  if (!ctrl.gameId) {
    return (
      <p
        className="atelier-smallcaps text-center mt-12"
        style={{ color: "var(--atelier-oxblood)" }}
      >
        Missing game id.
      </p>
    );
  }
  if (ctrl.game === undefined) {
    return (
      <p
        className="atelier-smallcaps text-center mt-12"
        style={{ color: "var(--atelier-brass)" }}
      >
        Loading game…
      </p>
    );
  }
  if (!ctrl.game) {
    return (
      <p
        className="atelier-smallcaps text-center mt-12"
        style={{ color: "var(--atelier-oxblood)" }}
      >
        This game is private or could not be found.
      </p>
    );
  }
  const game = ctrl.game;
  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;
  const myColor = ctrl.spectate ? null : ctrl.myColor;

  return (
    <div className="space-y-4 lg:space-y-8">
      <GameAbortedBanner
        theme="atelier"
        status={game.status}
        endReason={game.endReason}
      />

      <div className="flex justify-end lg:hidden">
        <Link to="/dashboard" className="atelier-btn atelier-btn--ghost text-sm">
          ← Salon
        </Link>
      </div>

      <section className="mx-auto w-full" style={{ maxWidth: 620 }}>
        <TurnIndicator
          theme="atelier"
          currentTurn={game.currentTurn}
          myColor={myColor}
          spectate={ctrl.spectate}
          whiteName={ctrl.whiteName}
          blackName={ctrl.blackName}
          status={game.status}
          className="mb-4"
        />
        <AtelierBoard
          game={game}
          myColor={myColor}
          isAuthenticated={ctrl.isAuthenticated}
          readOnly={ctrl.spectate}
        />
      </section>

      <div className="grid grid-cols-12 gap-8 items-start">
        <aside className="atelier-panel col-span-12 lg:col-span-4 relative lg:col-start-9" style={{ padding: 0 }}>
          <Corners />
          <div
            className="atelier-smallcaps"
            style={{
              color: "var(--atelier-brass)",
              padding: "16px 20px",
              borderBottom: "1px solid var(--atelier-brass-dim)",
            }}
          >
            Salon
          </div>
          <div style={{ height: 380 }}>
            <GameChat {...getGameChatProps(ctrl, game)} headerLabel="Salon chat" />
          </div>
        </aside>
      </div>

      <header className="hidden text-center lg:block">
        <div className="atelier-rule mb-4">
          <span className="atelier-smallcaps">Match № {game._id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-center max-w-3xl mx-auto">
          <div className="text-center sm:text-right min-w-0">
            <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              White
            </div>
            <div
              className="atelier-display truncate"
              style={{ fontSize: "clamp(1.25rem, 5vw, 1.8rem)", fontStyle: "italic" }}
            >
              {ctrl.whiteName}
            </div>
          </div>
          <div className="text-center order-first sm:order-none">
            <span
              className="atelier-display"
              style={{
                fontSize: "1.3rem",
                fontStyle: "italic",
                color: "var(--atelier-brass)",
              }}
            >
              vs
            </span>
          </div>
          <div className="text-center sm:text-left min-w-0">
            <div className="atelier-smallcaps" style={{ color: "var(--atelier-brass)" }}>
              Black
            </div>
            <div
              className="atelier-display truncate"
              style={{ fontSize: "clamp(1.25rem, 5vw, 1.8rem)", fontStyle: "italic" }}
            >
              {ctrl.blackName}
            </div>
          </div>
        </div>
        <p
          className="atelier-smallcaps mt-4"
          style={{ color: "var(--atelier-brass)" }}
        >
          {game.status} · {game.mode.replace(/_/g, " ")}
          {ctrl.spectate
            ? " · observing"
            : ctrl.myColor
              ? ` · you play ${ctrl.myColor}`
              : ""}
        </p>
        {game.endReason?.startsWith("engine_error:") && (
          <p
            className="atelier-smallcaps mt-2"
            style={{ color: "var(--atelier-oxblood)" }}
          >
            Engine error · {game.endReason.replace(/^engine_error:\s*/, "")}
          </p>
        )}
        <GameDisconnectStatus
          game={game}
          myColor={ctrl.myColor}
          className="atelier-smallcaps mt-2"
        />
        <div className="mt-3">
          <Link to="/dashboard" className="atelier-btn atelier-btn--ghost">
            ← Salon
          </Link>
        </div>
      </header>

      {game.status === "waiting" && (
        <section className="atelier-panel atelier-panel--parchment max-w-2xl mx-auto relative">
          <Corners />
          <div className="flex items-center gap-4">
            <span className="atelier-seal flex-none">✉</span>
            <div className="flex-1">
              <div
                className="atelier-smallcaps"
                style={{ color: "var(--atelier-oxblood)" }}
              >
                Awaiting opponent
              </div>
              <h3
                className="atelier-display"
                style={{
                  fontSize: "1.4rem",
                  fontStyle: "italic",
                  color: "var(--atelier-obsidian)",
                  marginTop: 2,
                }}
              >
                Send the sealed invitation.
              </h3>
              <code
                className="atelier-mono mt-3 block"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--atelier-obsidian)",
                  wordBreak: "break-all",
                  padding: "10px 12px",
                  background: "rgba(11,20,36,0.06)",
                  borderRadius: 2,
                }}
              >
                {inviteUrl}
              </code>
              <button
                type="button"
                className="atelier-btn mt-3"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                Copy invitation
              </button>
            </div>
          </div>
        </section>
      )}
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
