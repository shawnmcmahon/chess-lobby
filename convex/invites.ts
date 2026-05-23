import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { generateInviteToken } from "./lib/games";
import { STARTING_FEN } from "./lib/chess";
import {
  categorizeTimeControl,
  computeTurnDeadline,
} from "./lib/timeControl";
import { playType } from "./schema";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const RATING_WINDOW = 200;

export const send = mutation({
  args: {
    toUserId: v.id("users"),
    playType: v.optional(playType),
    baseTimeMs: v.optional(v.number()),
    incrementMs: v.optional(v.number()),
    daysPerTurn: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const fromUser = await getCurrentUser(ctx);
    if (fromUser._id === args.toUserId) {
      throw new Error("Cannot challenge yourself");
    }

    const toUser = await ctx.db.get(args.toUserId);
    if (!toUser) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const inviteToken = generateInviteToken();
    const play = args.playType ?? "live";
    const incrementMs = args.incrementMs ?? 0;

    let category: "bullet" | "blitz" | "rapid" | "classical" | "correspondence" | undefined;
    if (play === "correspondence") {
      category = "correspondence";
    } else if (args.baseTimeMs !== undefined) {
      category = categorizeTimeControl(args.baseTimeMs, incrementMs);
    }

    const gameId = await ctx.db.insert("games", {
      status: "waiting",
      mode: "human_vs_human",
      fen: STARTING_FEN,
      currentTurn: "white",
      whiteUserId: fromUser._id,
      inviteToken,
      inviteExpiresAt: now + INVITE_TTL_MS,
      createdByUserId: fromUser._id,
      createdAt: now,
      updatedAt: now,
      playType: play,
      timeControlCategory: category,
      baseTimeMs: args.baseTimeMs,
      incrementMs: args.baseTimeMs !== undefined ? incrementMs : undefined,
      daysPerTurn: args.daysPerTurn,
      whiteTimeMs: args.baseTimeMs,
      blackTimeMs: args.baseTimeMs,
      turnDeadlineAt:
        play === "correspondence" && args.daysPerTurn
          ? computeTurnDeadline(now, args.daysPerTurn)
          : undefined,
      lastMoveAt: now,
      isPublic: true,
    });

    await ctx.db.insert("gameInvites", {
      fromUserId: fromUser._id,
      toUserId: args.toUserId,
      gameId,
      status: "pending",
      createdAt: now,
    });

    return { gameId, inviteToken };
  },
});

export const listPendingForMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const invites = await ctx.db
      .query("gameInvites")
      .withIndex("by_toUser_and_status", (q) =>
        q.eq("toUserId", user._id).eq("status", "pending"),
      )
      .collect();

    return await Promise.all(
      invites.map(async (invite) => {
        const fromUser = await ctx.db.get(invite.fromUserId);
        const game = await ctx.db.get(invite.gameId);
        return { invite, fromUser, game };
      }),
    );
  },
});

export const accept = mutation({
  args: { inviteId: v.id("gameInvites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.toUserId !== userId) {
      throw new Error("Invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error("Invite is no longer pending");
    }

    const game = await ctx.db.get(invite.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const now = Date.now();
    await ctx.db.patch(invite.gameId, {
      blackUserId: userId,
      status: "active",
      updatedAt: now,
      lastMoveAt: now,
    });
    await ctx.db.patch(args.inviteId, { status: "accepted" });

    return invite.gameId;
  },
});

export const decline = mutation({
  args: { inviteId: v.id("gameInvites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.toUserId !== userId) {
      throw new Error("Invite not found");
    }

    await ctx.db.patch(args.inviteId, { status: "declined" });
    await ctx.db.patch(invite.gameId, {
      status: "abandoned",
      updatedAt: Date.now(),
    });
  },
});
