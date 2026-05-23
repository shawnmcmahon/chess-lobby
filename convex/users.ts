import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { ensureUserStats } from "./lib/stats";

export const syncProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const displayName = user.displayName ?? identity?.name ?? user.name;
    const profileComplete = Boolean(displayName?.trim());

    await ctx.db.patch(userId, {
      email: identity?.email ?? user.email,
      name: identity?.name ?? user.name,
      image: identity?.pictureUrl ?? user.image,
      displayName,
      profileComplete,
      rating: user.rating ?? 1200,
      lastSeenAt: now,
    });

    await ensureUserStats(ctx, userId);

    return userId;
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserOrNull(ctx);
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      displayName: user.displayName ?? user.name ?? "Player",
      bio: user.bio,
      rating: user.rating ?? 1200,
      image: user.image,
    };
  },
});

export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new Error("Display name is required");
    }

    await ctx.db.patch(user._id, {
      displayName,
      name: displayName,
      bio: args.bio,
      image: args.avatarUrl ?? user.image,
      profileComplete: true,
      lastSeenAt: Date.now(),
    });

    return user._id;
  },
});

export const listForLobby = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userIds.length === 0) {
      return [];
    }

    const userIdSet = new Set(args.userIds);
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const playingUserIds = new Set<(typeof args.userIds)[number]>();
    for (const game of activeGames) {
      if (game.whiteUserId && userIdSet.has(game.whiteUserId)) {
        playingUserIds.add(game.whiteUserId);
      }
      if (game.blackUserId && userIdSet.has(game.blackUserId)) {
        playingUserIds.add(game.blackUserId);
      }
    }

    const users = await Promise.all(args.userIds.map((id) => ctx.db.get(id)));
    return users
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .map((u) => ({
        ...u,
        inActiveGame: playingUserIds.has(u._id),
      }));
  },
});
