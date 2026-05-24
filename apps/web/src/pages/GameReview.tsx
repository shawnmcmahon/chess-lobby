import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { buildGameReplayFromPgn } from "@/lib/gameReplay";
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
    api.games.getForReview,
    gameId ? { gameId: gameId as Id<"games"> } : "skip",
  );
  const saveAnalysis = useMutation(api.games.saveAnalysis);

  const { fens, rows, totalPlies, pgnError } = useMemo(
    () => buildGameReplayFromPgn(game?.pgn),
    [game?.pgn],
  );

  const replay = useGameReplay(totalPlies);
  const currentFen = fens[replay.plyIndex] ?? fens[0]!;
  const { evals, loading, progress, serialize } = useStockfishAnalysis(
    fens,
    game?.analysisJson,
  );

  const rowsWithEvals = useMemo(() => {
    if (!Array.isArray(evals)) {
      return rows;
    }
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
      !Array.isArray(evals) ||
      evals.some((e) => !e)
    ) {
      return;
    }
    void saveAnalysis({ gameId: game._id, analysisJson: serialize() });
  }, [game, loading, evals, fens.length, serialize, saveAnalysis]);

  const currentEval = Array.isArray(evals) ? evals[replay.plyIndex] : undefined;

  if (pgnError && game) {
    if (theme === "bento") {
      return <BentoGameReviewNotFound message={pgnError} />;
    }
    if (theme === "brutal") {
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
    if (theme === "atelier") {
      return <AtelierGameReview status="not_found" endReason={pgnError} />;
    }
    return <DefaultGameReviewNotFound message={pgnError} />;
  }

  if (theme === "atelier") {
    const atelierStatus = !gameId
      ? ("missing" as const)
      : game === undefined
        ? ("loading" as const)
        : !game
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
        currentEval={atelierStatus === "ready" ? currentEval ?? null : undefined}
        replay={atelierStatus === "ready" ? replay : undefined}
        rowsWithEvals={atelierStatus === "ready" ? rowsWithEvals : undefined}
        totalPlies={totalPlies}
      />
    );
  }

  if (theme === "bento") {
    if (!gameId) return <BentoGameReviewMissing />;
    if (game === undefined) return <BentoGameReviewLoading />;
    if (!game) return <BentoGameReviewNotFound />;
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
    if (!game) {
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
  if (!game) {
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
