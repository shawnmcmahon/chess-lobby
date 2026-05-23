import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { ChessBoardView } from "./ChessBoardView";

export function LiveGamesCarousel() {
  const liveGames = useQuery(api.games.listActiveForSpectate, { limit: 20 });
  const [index, setIndex] = useState(0);

  if (!liveGames || liveGames.length === 0) {
    return (
      <p className="text-sm text-stone-500">No live games to spectate right now.</p>
    );
  }

  const current = liveGames[index % liveGames.length];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-amber-400/90">Live games</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + liveGames.length) % liveGames.length)}
            className="rounded border border-stone-700 px-2 py-0.5 text-xs"
          >
            ←
          </button>
          <span className="px-2 text-xs text-stone-500">
            {(index % liveGames.length) + 1} / {liveGames.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % liveGames.length)}
            className="rounded border border-stone-700 px-2 py-0.5 text-xs"
          >
            →
          </button>
        </div>
      </div>

      <Link
        to={`/game/${current.game._id}?spectate=1`}
        className="block rounded-lg border border-stone-800 bg-stone-900/40 p-3 hover:border-amber-800/50"
      >
        <p className="mb-2 text-sm">
          <span className="font-medium">{current.whiteName}</span>
          <span className="text-stone-500"> vs </span>
          <span className="font-medium">{current.blackName}</span>
        </p>
        <div className="mx-auto w-full max-w-[360px] overflow-hidden">
          <ChessBoardView fen={current.game.fen} readOnly allowDrawingArrows />
        </div>
        <p className="mt-1 text-xs capitalize text-stone-500">
          {current.game.timeControlCategory ?? "live"} · click to spectate
        </p>
      </Link>
    </div>
  );
}
