import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { applyMove, applyUciMove, STARTING_FEN } from "./lib/chess";
import { generateInviteToken, playerColorForUser } from "./lib/games";
import { getCurrentUserOrNull } from "./lib/auth";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getInternal = internalQuery({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getByInviteToken = query({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();
  },
});

export const create = mutation({
  args: {
    mode: v.union(v.literal("human_vs_human"), v.literal("human_vs_engine")),
    engineDifficulty: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const inviteToken = generateInviteToken();
    const difficulty = args.engineDifficulty ?? 10;

    const gameId = await ctx.db.insert("games", {
      status: args.mode === "human_vs_engine" ? "active" : "waiting",
      mode: args.mode,
      fen: STARTING_FEN,
      currentTurn: "white",
      whiteUserId: userId,
      blackUserId: args.mode === "human_vs_engine" ? undefined : undefined,
      inviteToken,
      inviteExpiresAt: now + INVITE_TTL_MS,
      engineDifficulty: args.mode === "human_vs_engine" ? difficulty : undefined,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    return { gameId, inviteToken };
  },
});

export const joinByInvite = mutation({
  args: {
    inviteToken: v.string(),
    guestName: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();

    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Game is not open for joining");
    }
    if (Date.now() > game.inviteExpiresAt) {
      throw new Error("Invite has expired");
    }

    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    if (userId) {
      if (game.whiteUserId === userId || game.blackUserId === userId) {
        return game._id;
      }
      if (game.blackUserId || game.blackGuestName) {
        throw new Error("Game is full");
      }
      await ctx.db.patch(game._id, {
        blackUserId: userId,
        status: "active",
        updatedAt: now,
      });
      return game._id;
    }

    const guestName = args.guestName?.trim();
    const guestSessionId = args.guestSessionId?.trim();
    if (!guestName || !guestSessionId) {
      throw new Error("Guest name and session required");
    }

    if (game.blackUserId || game.blackGuestName) {
      throw new Error("Game is full");
    }

    await ctx.db.patch(game._id, {
      blackGuestName: guestName,
      blackGuestSessionId: guestSessionId,
      status: "active",
      updatedAt: now,
    });

    return game._id;
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.id("games"),
    from: v.string(),
    to: v.string(),
    promotion: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "active") {
      throw new Error("Game is not active");
    }

    const userId = await getAuthUserId(ctx);
    const color = playerColorForUser(game, userId, args.guestSessionId ?? null);
    if (!color) {
      throw new Error("You are not a participant in this game");
    }
    if (game.currentTurn !== color) {
      throw new Error("Not your turn");
    }

    const result = applyMove(game.fen, args.from, args.to, args.promotion);
    const now = Date.now();

    const updates: Record<string, unknown> = {
      fen: result.fen,
      pgn: result.pgn,
      currentTurn: result.currentTurn,
      updatedAt: now,
    };

    if (result.isGameOver) {
      updates.status = "finished";
      updates.winner = result.winner;
      updates.endReason = result.endReason;
    }

    await ctx.db.patch(args.gameId, updates);

    if (
      game.mode === "human_vs_engine" &&
      !result.isGameOver &&
      result.currentTurn === "black"
    ) {
      await ctx.scheduler.runAfter(0, internal.engine.makeEngineMove, {
        gameId: args.gameId,
      });
    }

    return args.gameId;
  },
});

export const resign = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const userId = await getAuthUserId(ctx);
    const color = playerColorForUser(game, userId, args.guestSessionId ?? null);
    if (!color) {
      throw new Error("You are not a participant in this game");
    }

    const winner = color === "white" ? "black" : "white";
    await ctx.db.patch(args.gameId, {
      status: "finished",
      winner,
      endReason: "resign",
      updatedAt: Date.now(),
    });
  },
});

export const applyEngineMoveInternal = internalMutation({
  args: {
    gameId: v.id("games"),
    uci: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "active" || game.mode !== "human_vs_engine") {
      return;
    }

    const result = applyUciMove(game.fen, args.uci);
    const updates: Record<string, unknown> = {
      fen: result.fen,
      pgn: result.pgn,
      currentTurn: result.currentTurn,
      updatedAt: Date.now(),
    };

    if (result.isGameOver) {
      updates.status = "finished";
      updates.winner = result.winner;
      updates.endReason = result.endReason;
    }

    await ctx.db.patch(args.gameId, updates);
  },
});

export const listMyActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return [];
    }

    const asWhite = await ctx.db
      .query("games")
      .withIndex("by_whiteUser", (q) => q.eq("whiteUserId", user._id))
      .collect();
    const asBlack = await ctx.db
      .query("games")
      .withIndex("by_blackUser", (q) => q.eq("blackUserId", user._id))
      .collect();

    const games = [...asWhite, ...asBlack];
    const unique = new Map(games.map((g) => [g._id, g]));
    return Array.from(unique.values()).filter(
      (g) => g.status === "active" || g.status === "waiting",
    );
  },
});
