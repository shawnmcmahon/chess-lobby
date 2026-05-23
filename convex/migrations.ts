import { internalMutation } from "./_generated/server";
import { recordGameStats } from "./lib/stats";

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
