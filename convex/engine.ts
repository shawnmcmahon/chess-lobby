import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getBestMove } from "./lib/computerEngine";

export const makeEngineMove = internalAction({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.runQuery(internal.games.getInternal, {
      gameId: args.gameId,
    });

    if (!game || game.status !== "active" || game.mode !== "human_vs_engine") {
      return;
    }

    if (game.currentTurn !== "black") {
      return;
    }

    try {
      const bestMove = await getBestMove(
        game.fen,
        game.engineDifficulty ?? 10,
        800,
      );

      await ctx.runMutation(internal.games.applyEngineMoveInternal, {
        gameId: args.gameId,
        uci: bestMove,
      });
    } catch (err) {
      console.error("Engine move failed", err);
      await ctx.runMutation(internal.games.setEngineError, {
        gameId: args.gameId,
        message: err instanceof Error ? err.message : "Engine failed",
      });
    }
  },
});
