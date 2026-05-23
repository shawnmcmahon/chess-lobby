"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const makeEngineMove = internalAction({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.runQuery(internal.games.getInternal, {
      gameId: args.gameId,
    });

    if (!game || game.status !== "active" || game.mode !== "human_vs_engine") {
      return;
    }

    const engineUrl = process.env.ENGINE_API_URL;
    const engineKey = process.env.ENGINE_API_KEY;
    if (!engineUrl) {
      console.error("ENGINE_API_URL not configured");
      return;
    }

    const response = await fetch(`${engineUrl}/api/best-move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(engineKey ? { "X-Api-Key": engineKey } : {}),
      },
      body: JSON.stringify({
        fen: game.fen,
        skill: game.engineDifficulty ?? 10,
        movetimeMs: 800,
      }),
    });

    if (!response.ok) {
      console.error("Engine request failed", await response.text());
      return;
    }

    const data = (await response.json()) as { bestMove: string };
    if (!data.bestMove) {
      return;
    }

    await ctx.runMutation(internal.games.applyEngineMoveInternal, {
      gameId: args.gameId,
      uci: data.bestMove,
    });
  },
});
