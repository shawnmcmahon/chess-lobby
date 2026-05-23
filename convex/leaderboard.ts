import { v } from "convex/values";
import { query } from "./_generated/server";
import { timeControlCategory } from "./schema";

export const listTop = query({
  args: {
    sortBy: v.union(v.literal("wins"), v.literal("losses"), v.literal("draws")),
    category: v.optional(timeControlCategory),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const take = Math.min(args.limit ?? 50, 50);
    const indexName =
      args.sortBy === "wins"
        ? "by_totalWins"
        : args.sortBy === "losses"
          ? "by_totalLosses"
          : "by_totalDraws";

    const stats = await ctx.db
      .query("userStats")
      .withIndex(indexName)
      .order("desc")
      .take(take);

    const category = args.category;
    const rows = await Promise.all(
      stats.map(async (row, idx) => {
        const user = await ctx.db.get(row.userId);
        const catStats = category ? row[category] : null;
        return {
          rank: idx + 1,
          userId: row.userId,
          displayName: user?.displayName ?? user?.name ?? "Player",
          rating: user?.rating ?? 1200,
          wins: catStats?.wins ?? row.totalWins,
          losses: catStats?.losses ?? row.totalLosses,
          draws: catStats?.draws ?? row.totalDraws,
        };
      }),
    );

    return rows;
  },
});
