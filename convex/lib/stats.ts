import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { TimeControlCategory } from "./timeControl";

export type CategoryStats = {
  wins: number;
  losses: number;
  draws: number;
};

export const EMPTY_CATEGORY_STATS: CategoryStats = {
  wins: 0,
  losses: 0,
  draws: 0,
};

export type UserStatsDoc = {
  userId: Id<"users">;
  bullet: CategoryStats;
  blitz: CategoryStats;
  rapid: CategoryStats;
  classical: CategoryStats;
  correspondence: CategoryStats;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export function createEmptyUserStats(userId: Id<"users">): UserStatsDoc {
  return {
    userId,
    bullet: { ...EMPTY_CATEGORY_STATS },
    blitz: { ...EMPTY_CATEGORY_STATS },
    rapid: { ...EMPTY_CATEGORY_STATS },
    classical: { ...EMPTY_CATEGORY_STATS },
    correspondence: { ...EMPTY_CATEGORY_STATS },
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
  };
}

function categoryField(
  category: TimeControlCategory,
): keyof Pick<
  UserStatsDoc,
  "bullet" | "blitz" | "rapid" | "classical" | "correspondence"
> {
  return category;
}

export async function ensureUserStats(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"userStats">> {
  const existing = await ctx.db
    .query("userStats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (existing) {
    return existing;
  }

  const id = await ctx.db.insert("userStats", createEmptyUserStats(userId));
  const doc = await ctx.db.get(id);
  if (!doc) {
    throw new Error("Failed to create userStats");
  }
  return doc;
}

type GameOutcome = "win" | "loss" | "draw";

function outcomeForColor(
  winner: "white" | "black" | undefined,
  color: "white" | "black",
): GameOutcome {
  if (!winner) return "draw";
  return winner === color ? "win" : "loss";
}

function applyOutcome(stats: CategoryStats, outcome: GameOutcome): CategoryStats {
  if (outcome === "win") {
    return { ...stats, wins: stats.wins + 1 };
  }
  if (outcome === "loss") {
    return { ...stats, losses: stats.losses + 1 };
  }
  return { ...stats, draws: stats.draws + 1 };
}

export async function recordGameStats(
  ctx: MutationCtx,
  game: Doc<"games">,
): Promise<void> {
  const category = game.timeControlCategory ?? "rapid";
  const field = categoryField(category);

  const players: Array<{ userId: Id<"users">; color: "white" | "black" }> = [];
  if (game.whiteUserId) {
    players.push({ userId: game.whiteUserId, color: "white" });
  }
  if (game.blackUserId) {
    players.push({ userId: game.blackUserId, color: "black" });
  }

  for (const { userId, color } of players) {
    const stats = await ensureUserStats(ctx, userId);
    const outcome = outcomeForColor(game.winner, color);
    const categoryStats = applyOutcome(stats[field], outcome);

    const totalWins = stats.totalWins + (outcome === "win" ? 1 : 0);
    const totalLosses = stats.totalLosses + (outcome === "loss" ? 1 : 0);
    const totalDraws = stats.totalDraws + (outcome === "draw" ? 1 : 0);

    await ctx.db.patch(stats._id, {
      [field]: categoryStats,
      totalWins,
      totalLosses,
      totalDraws,
    });
  }
}
