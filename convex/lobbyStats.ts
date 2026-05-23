import { query } from "./_generated/server";

export const getPublicStats = query({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500);

    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(200);

    return {
      inPlayCount: activeGames.length,
      waitingCount: waitingGames.length,
    };
  },
});
