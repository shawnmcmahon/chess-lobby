import { Chess } from "chess.js";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { ChessBoardView } from "@/components/ChessBoardView";
import { EvalBar } from "@/components/EvalBar";
import { MoveList, type MoveRow } from "@/components/MoveList";
import { useGameReplay } from "@/hooks/useGameReplay";
import { useStockfishAnalysis } from "@/hooks/useStockfishAnalysis";

function resultLabel(
  game: Doc<"games">,
  userId?: Doc<"users">["_id"],
): string {
  if (!userId) return game.endReason ?? "Finished";
  const isWhite = game.whiteUserId === userId;
  const isBlack = game.blackUserId === userId;
  if (!isWhite && !isBlack) return "Spectator view";
  if (!game.winner) return "Draw";
  const won =
    (game.winner === "white" && isWhite) || (game.winner === "black" && isBlack);
  return won ? "Win" : "Loss";
}

export function GameReview() {
  const { gameId } = useParams<{ gameId: string }>();
  const user = useQuery(api.users.current);
  const game = useQuery(
    api.games.get,
    gameId ? { gameId: gameId as Id<"games"> } : "skip",
  );
  const saveAnalysis = useMutation(api.games.saveAnalysis);

  const { fens, rows, totalPlies } = useMemo(() => {
    const startFen = new Chess().fen();
    if (!game?.pgn) {
      return { fens: [startFen], rows: [] as MoveRow[], totalPlies: 0 };
    }
    const chess = new Chess();
    chess.loadPgn(game.pgn);
    const history = chess.history();
    chess.reset();
    const positionFens = [chess.fen()];
    for (const move of history) {
      chess.move(move);
      positionFens.push(chess.fen());
    }

    const moveRows: MoveRow[] = [];
    for (let i = 0; i < history.length; i += 2) {
      moveRows.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }

    return {
      fens: positionFens,
      rows: moveRows,
      totalPlies: history.length,
    };
  }, [game?.pgn]);

  const replay = useGameReplay(totalPlies);
  const currentFen = fens[replay.plyIndex] ?? new Chess().fen();
  const { evals, loading, progress, serialize } = useStockfishAnalysis(
    fens,
    game?.analysisJson,
  );

  const rowsWithEvals = useMemo(() => {
    return rows.map((row, idx) => ({
      ...row,
      whiteEval: evals[idx * 2 + 1],
      blackEval: evals[idx * 2 + 2],
    }));
  }, [rows, evals]);

  useEffect(() => {
    if (
      !game ||
      game.analysisJson ||
      loading ||
      evals.length !== fens.length ||
      evals.some((e) => !e)
    ) {
      return;
    }
    void saveAnalysis({ gameId: game._id, analysisJson: serialize() });
  }, [game, loading, evals, fens.length, serialize, saveAnalysis]);

  if (!gameId) {
    return <p className="text-red-400">Missing game id.</p>;
  }
  if (game === undefined) {
    return <p className="text-stone-400">Loading review…</p>;
  }
  if (!game || game.status !== "finished") {
    return <p className="text-red-400">Finished game not found.</p>;
  }

  const currentEval = evals[replay.plyIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-amber-400">Game review</h1>
          <p className="text-sm text-stone-500">
            {resultLabel(game, user?._id)} · {game.endReason}
            {loading && ` · Analyzing ${progress}%`}
          </p>
        </div>
        <Link to={`/game/${game._id}`} className="text-sm text-stone-400 hover:text-amber-300">
          Back to game
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <EvalBar eval={currentEval} />
          <ChessBoardView fen={currentFen} readOnly allowDrawingArrows />
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={replay.goFirst} className="rounded border border-stone-700 px-2 py-1 text-sm">⏮</button>
            <button type="button" onClick={replay.goPrev} className="rounded border border-stone-700 px-2 py-1 text-sm">◀</button>
            <button type="button" onClick={replay.togglePlay} className="rounded bg-amber-700 px-3 py-1 text-sm text-stone-950">
              {replay.playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={replay.goNext} className="rounded border border-stone-700 px-2 py-1 text-sm">▶</button>
            <button type="button" onClick={replay.goLast} className="rounded border border-stone-700 px-2 py-1 text-sm">⏭</button>
          </div>
        </div>

        <div className="space-y-3">
          <MoveList
            rows={rowsWithEvals}
            plyIndex={replay.plyIndex}
            onSelectPly={replay.setPlyIndex}
          />
          <p className="text-xs text-stone-500">
            Move {replay.plyIndex} / {totalPlies} · Use ← → keys to navigate
          </p>
        </div>
      </div>
    </div>
  );
}
