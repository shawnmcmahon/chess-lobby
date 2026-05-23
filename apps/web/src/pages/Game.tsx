import { Link } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { GameChat } from "@/components/GameChat";
import { useGameController, type GameController } from "@/hooks/useGameController";
import { useTheme } from "@/theme/themeContext";
import { BentoGame } from "@/theme/bento/BentoGame";
import { BrutalGame } from "@/theme/brutal/BrutalGame";
import { AtelierGame } from "@/theme/atelier/AtelierGame";

export function Game() {
  const ctrl = useGameController();
  const { theme } = useTheme();
  switch (theme) {
    case "bento":
      return <BentoGame ctrl={ctrl} />;
    case "brutal":
      return <BrutalGame ctrl={ctrl} />;
    case "atelier":
      return <AtelierGame ctrl={ctrl} />;
    default:
      return <DefaultGame ctrl={ctrl} />;
  }
}

function DefaultGame({ ctrl }: { ctrl: GameController }) {
  if (!ctrl.gameId) {
    return <p className="text-red-400">Missing game id.</p>;
  }
  if (ctrl.game === undefined) {
    return <p className="text-stone-400">Loading game…</p>;
  }
  if (!ctrl.game) {
    return <p className="text-red-400">Game not found.</p>;
  }
  const game = ctrl.game;
  const inviteUrl = `${window.location.origin}/game/join/${game.inviteToken}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-amber-400">
            {ctrl.whiteName} vs {ctrl.blackName}
          </h1>
          <p className="text-sm text-stone-500 capitalize">
            {game.status} · {game.mode.replace(/_/g, " ")}
            {ctrl.spectate && " · Spectating"}
            {!ctrl.spectate && ctrl.myColor && ` · You are ${ctrl.myColor}`}
          </p>
          {game.endReason?.startsWith("engine_error:") && (
            <p className="text-sm text-red-400">
              Engine error: {game.endReason.replace(/^engine_error:\s*/, "")}
            </p>
          )}
        </div>
        <Link to="/dashboard" className="text-sm text-stone-400 hover:text-amber-300">
          Dashboard
        </Link>
      </div>

      {game.status === "waiting" && (
        <div className="rounded-lg border border-stone-700 bg-stone-900/50 p-4 text-sm">
          <p>Waiting for opponent. Share this link:</p>
          <code className="mt-2 block break-all text-amber-300/90">{inviteUrl}</code>
          <button
            type="button"
            className="mt-2 rounded border border-stone-600 px-2 py-1 text-xs"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
          >
            Copy link
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <GameBoard
          game={game}
          myColor={ctrl.spectate ? null : ctrl.myColor}
          isAuthenticated={ctrl.isAuthenticated}
          readOnly={ctrl.spectate}
        />
        {!ctrl.spectate && (
          <GameChat
            gameId={game._id}
            guestSessionId={ctrl.isAuthenticated ? undefined : ctrl.guestSessionId}
            guestName={
              ctrl.isAuthenticated
                ? undefined
                : ctrl.myColor === "white"
                  ? game.whiteGuestName ?? "Guest"
                  : game.blackGuestName ?? "Guest"
            }
          />
        )}
      </div>
    </div>
  );
}
