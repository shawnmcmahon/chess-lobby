import { query } from "./_generated/server";
import { isSpectateEligible } from "./lib/games";

export const getPublicStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activeCandidates = await ctx.db
      .query("games")
      .withIndex("by_status_and_public", (q) =>
        q.eq("status", "active").eq("isPublic", true),
      )
      .take(500);

    let inPlayCount = 0;
    for (const game of activeCandidates) {
      const sessions = await ctx.db
        .query("gameParticipantSessions")
        .withIndex("by_game", (q) => q.eq("gameId", game._id))
        .collect();
      if (isSpectateEligible(game, sessions, now)) {
        inPlayCount += 1;
      }
    }

    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(200);

    return {
      inPlayCount,
      waitingCount: waitingGames.length,
    };
  },
});
