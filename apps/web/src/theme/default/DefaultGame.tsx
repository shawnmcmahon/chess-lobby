import { Link } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { GameChat } from "@/components/GameChat";
import type { GameController } from "@/hooks/useGameController";
import { getGameChatProps } from "@/lib/gameChat";

export function DefaultGame({ ctrl }: { ctrl: GameController }) {
  if (!ctrl.gameId) {
    return <p className="text-[var(--default-danger)]">Missing game id.</p>;
  }
  if (ctrl.game === undefined) {
    return (
      <p className="default-mono text-[var(--default-mist)]">Loading game…</p>
    );
  }
  if (!ctrl.game) {
    return <p className="text-[var(--default-danger)]">Game not found.</p>;
  }
  const game = ctrl.game;
  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;

  return (
    <div className="space-y-4">
      <section className="default-panel default-panel--accent flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="default-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--default-ember-dim)]">
            Match
          </p>
          <h1 className="default-display mt-1 text-2xl">
            {ctrl.whiteName}{" "}
            <span className="text-[var(--default-mist)] italic">vs</span>{" "}
            {ctrl.blackName}
          </h1>
          <p className="default-mono mt-1 text-sm capitalize text-[var(--default-mist)]">
            {game.status} · {game.mode.replace(/_/g, " ")}
            {ctrl.spectate && " · Spectating"}
            {!ctrl.spectate && ctrl.myColor && ` · You are ${ctrl.myColor}`}
          </p>
          {game.endReason?.startsWith("engine_error:") && (
            <p className="default-mono mt-2 text-sm text-[var(--default-danger)]">
              Engine error: {game.endReason.replace(/^engine_error:\s*/, "")}
            </p>
          )}
        </div>
        <Link to="/dashboard" className="default-btn default-btn--ghost text-sm">
          Dashboard
        </Link>
      </section>

      {game.status === "waiting" && (
        <section className="default-panel p-4">
          <p className="default-mono text-sm">Waiting for opponent. Share this link:</p>
          <code className="default-mono mt-2 block break-all text-sm text-[var(--default-ember)]">
            {inviteUrl}
          </code>
          <button
            type="button"
            className="default-btn default-btn--ghost mt-3 text-xs"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
          >
            Copy link
          </button>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="default-board-frame">
          <div className="default-board-frame__glow" aria-hidden />
          <div className="default-board-frame__inner p-2">
            <GameBoard
              game={game}
              myColor={ctrl.spectate ? null : ctrl.myColor}
              isAuthenticated={ctrl.isAuthenticated}
              readOnly={ctrl.spectate}
            />
          </div>
        </div>
        <GameChat {...getGameChatProps(ctrl, game)} />
      </div>
    </div>
  );
}
