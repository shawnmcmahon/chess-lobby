import { Chess } from "chess.js";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { type MoveRow } from "@/components/MoveList";
import { useGameReplay } from "@/hooks/useGameReplay";
import { useStockfishAnalysis } from "@/hooks/useStockfishAnalysis";
import { useTheme } from "@/theme/themeContext";
import { AtelierGameReview } from "@/theme/atelier/AtelierGameReview";
import {
  BentoGameReview,
  BentoGameReviewLoading,
  BentoGameReviewMissing,
  BentoGameReviewNotFound,
} from "@/theme/bento/BentoGameReview";
import { BrutalGameReview } from "@/theme/brutal/BrutalGameReview";
import {
  DefaultGameReview,
  DefaultGameReviewLoading,
  DefaultGameReviewMissing,
  DefaultGameReviewNotFound,
} from "@/theme/default/DefaultGameReview";

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

function brutalReviewShell(
  view: "missing" | "loading" | "notFound",
  replay: ReturnType<typeof useGameReplay>,
  rowsWithEvals: MoveRow[],
  totalPlies: number,
  loading: boolean,
  progress: number,
  currentFen: string,
  currentEval: ReturnType<typeof useStockfishAnalysis>["evals"][number],
  game: Doc<"games"> | null | undefined,
) {
  return (
    <BrutalGameReview
      view={view}
      game={game}
      gameId={game?._id ?? null}
      resultSummary=""
      endReason={undefined}
      analyzing={loading}
      analyzeProgress={progress}
      currentFen={currentFen}
      currentEval={currentEval}
      rowsWithEvals={rowsWithEvals}
      plyIndex={replay.plyIndex}
      totalPlies={totalPlies}
      playing={replay.playing}
      onFirst={replay.goFirst}
      onPrev={replay.goPrev}
      onTogglePlay={replay.togglePlay}
      onNext={replay.goNext}
      onLast={replay.goLast}
      onSelectPly={replay.setPlyIndex}
    />
  );
}

export function GameReview() {
  const { gameId } = useParams<{ gameId: string }>();
  const user = useQuery(api.users.current);
  const { theme } = useTheme();
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

  const currentEval = evals[replay.plyIndex];

  if (theme === "atelier") {
    const atelierStatus = !gameId
      ? ("missing" as const)
      : game === undefined
        ? ("loading" as const)
        : !game || game.status !== "finished"
          ? ("not_found" as const)
          : ("ready" as const);

    return (
      <AtelierGameReview
        status={atelierStatus}
        gameId={game?._id}
        resultText={game ? resultLabel(game, user?._id) : undefined}
        endReason={game?.endReason}
        isAnalyzing={loading}
        analyzingProgress={progress}
        currentFen={atelierStatus === "ready" ? currentFen : undefined}
        currentEval={atelierStatus === "ready" ? evals[replay.plyIndex] ?? null : undefined}
        replay={atelierStatus === "ready" ? replay : undefined}
        rowsWithEvals={atelierStatus === "ready" ? rowsWithEvals : undefined}
        totalPlies={totalPlies}
      />
    );
  }

  if (theme === "bento") {
    if (!gameId) return <BentoGameReviewMissing />;
    if (game === undefined) return <BentoGameReviewLoading />;
    if (!game || game.status !== "finished") return <BentoGameReviewNotFound />;
    return (
      <BentoGameReview
        gameId={game._id}
        resultText={resultLabel(game, user?._id)}
        endReason={game.endReason}
        loading={loading}
        progress={progress}
        currentFen={currentFen}
        currentEval={currentEval}
        replay={replay}
        rowsWithEvals={rowsWithEvals}
        totalPlies={totalPlies}
      />
    );
  }

  if (theme === "brutal") {
    if (!gameId) {
      return brutalReviewShell(
        "missing",
        replay,
        rowsWithEvals,
        totalPlies,
        loading,
        progress,
        currentFen,
        currentEval,
        game,
      );
    }
    if (game === undefined) {
      return brutalReviewShell(
        "loading",
        replay,
        rowsWithEvals,
        totalPlies,
        loading,
        progress,
        currentFen,
        currentEval,
        game,
      );
    }
    if (!game || game.status !== "finished") {
      return brutalReviewShell(
        "notFound",
        replay,
        rowsWithEvals,
        totalPlies,
        loading,
        progress,
        currentFen,
        currentEval,
        game,
      );
    }
    return (
      <BrutalGameReview
        view="ready"
        game={game}
        gameId={game._id}
        resultSummary={resultLabel(game, user?._id)}
        endReason={game.endReason}
        analyzing={loading}
        analyzeProgress={progress}
        currentFen={currentFen}
        currentEval={currentEval}
        rowsWithEvals={rowsWithEvals}
        plyIndex={replay.plyIndex}
        totalPlies={totalPlies}
        playing={replay.playing}
        onFirst={replay.goFirst}
        onPrev={replay.goPrev}
        onTogglePlay={replay.togglePlay}
        onNext={replay.goNext}
        onLast={replay.goLast}
        onSelectPly={replay.setPlyIndex}
      />
    );
  }

  if (!gameId) {
    return <DefaultGameReviewMissing />;
  }
  if (game === undefined) {
    return <DefaultGameReviewLoading />;
  }
  if (!game || game.status !== "finished") {
    return <DefaultGameReviewNotFound />;
  }

  return (
    <DefaultGameReview
      gameId={game._id}
      resultText={resultLabel(game, user?._id)}
      endReason={game.endReason}
      loading={loading}
      progress={progress}
      currentFen={currentFen}
      currentEval={currentEval}
      replay={replay}
      rowsWithEvals={rowsWithEvals}
      totalPlies={totalPlies}
    />
  );
}
