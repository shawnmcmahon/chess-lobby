import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { generateInviteToken } from "./lib/games";
import { STARTING_FEN } from "./lib/chess";
import { categorizeTimeControl, type TimeControlCategory } from "./lib/timeControl";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const RATING_WINDOW = 200;

async function tryPairSeek(
  ctx: MutationCtx,
  userId: Id<"users">,
  userRating: number,
  category: TimeControlCategory,
  baseTimeMs: number,
  incrementMs: number,
): Promise<{ gameId: Id<"games"> } | null> {
  const candidates = await ctx.db
    .query("gameSeeks")
    .withIndex("by_category", (q) => q.eq("timeControlCategory", category))
    .take(20);

  const match = candidates.find(
    (seek) =>
      seek.userId !== userId &&
      userRating >= seek.minRating &&
      userRating <= seek.maxRating &&
      seek.baseTimeMs === baseTimeMs &&
      seek.incrementMs === incrementMs,
  );

  if (!match) {
    return null;
  }

  await ctx.db.delete(match._id);

  const now = Date.now();
  const inviteToken = generateInviteToken();
  const whiteIsSeeker = Math.random() < 0.5;
  const whiteUserId = whiteIsSeeker ? match.userId : userId;
  const blackUserId = whiteIsSeeker ? userId : match.userId;

  const gameId = await ctx.db.insert("games", {
    status: "active",
    mode: "human_vs_human",
    fen: STARTING_FEN,
    currentTurn: "white",
    whiteUserId,
    blackUserId,
    inviteToken,
    inviteExpiresAt: now + INVITE_TTL_MS,
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
    playType: "live",
    timeControlCategory: category,
    baseTimeMs,
    incrementMs,
    whiteTimeMs: baseTimeMs,
    blackTimeMs: baseTimeMs,
    lastMoveAt: now,
    isPublic: true,
  });

  return { gameId };
}

export const createSeek = mutation({
  args: {
    baseTimeMs: v.number(),
    incrementMs: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rating = user.rating ?? 1200;
    const category = categorizeTimeControl(args.baseTimeMs, args.incrementMs);

    const existingSeeks = await ctx.db
      .query("gameSeeks")
      .withIndex("by_category", (q) => q.eq("timeControlCategory", category))
      .take(50);

    for (const seek of existingSeeks) {
      if (seek.userId === user._id) {
        await ctx.db.delete(seek._id);
      }
    }

    const paired = await tryPairSeek(
      ctx,
      user._id,
      rating,
      category,
      args.baseTimeMs,
      args.incrementMs,
    );

    if (paired) {
      return { matched: true as const, gameId: paired.gameId };
    }

    const now = Date.now();
    await ctx.db.insert("gameSeeks", {
      userId: user._id,
      timeControlCategory: category,
      baseTimeMs: args.baseTimeMs,
      incrementMs: args.incrementMs,
      minRating: rating - RATING_WINDOW,
      maxRating: rating + RATING_WINDOW,
      createdAt: now,
    });

    return { matched: false as const, gameId: null };
  },
});

export const cancelSeek = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const seeks = await ctx.db
      .query("gameSeeks")
      .take(100);

    for (const seek of seeks) {
      if (seek.userId === user._id) {
        await ctx.db.delete(seek._id);
      }
    }
  },
});

export const getMySeek = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const seeks = await ctx.db
      .query("gameSeeks")
      .take(100);

    return seeks.find((s) => s.userId === user._id) ?? null;
  },
});
