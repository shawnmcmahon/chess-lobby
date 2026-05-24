import { internalMutation } from "./_generated/server";
import { recordGameStats } from "./lib/stats";

/** Abandon active vs-computer games left stuck after engine failures. */
export const cleanupStuckEngineGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let cleaned = 0;
    for (const game of activeGames) {
      if (game.mode !== "human_vs_engine") {
        continue;
      }
      await ctx.db.patch(game._id, {
        status: "abandoned",
        endReason: game.endReason ?? "engine_error: cleanup",
        updatedAt: Date.now(),
      });
      cleaned += 1;
    }

    return { cleaned };
  },
});

/** One-time backfill: set defaults on legacy games and rebuild userStats from finished games. */
export const backfillSchemaAndStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("games").take(500);
    for (const game of games) {
      const patch: Record<string, unknown> = {};
      if (game.playType === undefined) {
        patch.playType = "live";
      }
      if (game.isPublic === undefined) {
        patch.isPublic = true;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(game._id, patch);
      }
    }

    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .take(500);

    for (const game of finishedGames) {
      await recordGameStats(ctx, game);
    }

    return {
      gamesPatched: games.length,
      statsRecorded: finishedGames.length,
    };
  },
});
