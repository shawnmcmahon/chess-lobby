import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { generateInviteToken } from "./lib/games";
import { STARTING_FEN } from "./lib/chess";
import { categorizeTimeControl } from "./lib/timeControl";
import { buildLiveGameActivationPatch } from "./lib/liveClock";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

async function abandonQuickPairWaitingGames(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const asWhite = await ctx.db
    .query("games")
    .withIndex("by_whiteUser_and_status", (q) =>
      q.eq("whiteUserId", userId).eq("status", "waiting"),
    )
    .collect();

  for (const game of asWhite) {
    if (game.matchSource === "quick_pair") {
      await ctx.db.patch(game._id, {
        status: "abandoned",
        endReason: "cancelled",
        updatedAt: Date.now(),
      });
    }
  }
}

async function tryJoinOpenQuickPairGame(
  ctx: MutationCtx,
  userId: Id<"users">,
  baseTimeMs: number,
  incrementMs: number,
): Promise<{ gameId: Id<"games"> } | null> {
  const candidates = await ctx.db
    .query("games")
    .withIndex("by_status_and_matchSource", (q) =>
      q.eq("status", "waiting").eq("matchSource", "quick_pair"),
    )
    .order("desc")
    .take(20);

  const match = candidates.find(
    (game) =>
      game.whiteUserId !== userId &&
      game.baseTimeMs === baseTimeMs &&
      game.incrementMs === incrementMs &&
      !game.blackUserId &&
      !game.blackGuestName,
  );

  if (!match) {
    return null;
  }

  const now = Date.now();
  await ctx.db.patch(match._id, {
    blackUserId: userId,
    ...buildLiveGameActivationPatch(match, now),
  });

  return { gameId: match._id };
}

async function createQuickPairWaitingGame(
  ctx: MutationCtx,
  userId: Id<"users">,
  baseTimeMs: number,
  incrementMs: number,
): Promise<Id<"games">> {
  const now = Date.now();
  const category = categorizeTimeControl(baseTimeMs, incrementMs);
  const inviteToken = generateInviteToken();

  return await ctx.db.insert("games", {
    status: "waiting",
    mode: "human_vs_human",
    fen: STARTING_FEN,
    currentTurn: "white",
    whiteUserId: userId,
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
    isPublic: true,
    matchSource: "quick_pair",
  });
}

const createQuickPairReturns = v.union(
  v.object({
    matched: v.literal(true),
    gameId: v.id("games"),
  }),
  v.object({
    matched: v.literal(false),
    gameId: v.id("games"),
  }),
);

export const createQuickPair = mutation({
  args: {
    baseTimeMs: v.number(),
    incrementMs: v.number(),
  },
  returns: createQuickPairReturns,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    await abandonQuickPairWaitingGames(ctx, user._id);

    const joined = await tryJoinOpenQuickPairGame(
      ctx,
      user._id,
      args.baseTimeMs,
      args.incrementMs,
    );

    if (joined) {
      return { matched: true as const, gameId: joined.gameId };
    }

    const gameId = await createQuickPairWaitingGame(
      ctx,
      user._id,
      args.baseTimeMs,
      args.incrementMs,
    );

    return { matched: false as const, gameId };
  },
});

export const joinQuickPairGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const game = await ctx.db.get(args.gameId);

    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting" || game.matchSource !== "quick_pair") {
      throw new Error("Game is not open for joining");
    }
    if (game.whiteUserId === user._id) {
      throw new Error("You cannot join your own game");
    }
    if (game.blackUserId || game.blackGuestName) {
      throw new Error("Game is full");
    }
    if (Date.now() > game.inviteExpiresAt) {
      throw new Error("Game has expired");
    }

    const now = Date.now();
    await ctx.db.patch(game._id, {
      blackUserId: user._id,
      ...buildLiveGameActivationPatch(game, now),
    });

    return game._id;
  },
});

const hostSummary = v.object({
  _id: v.id("users"),
  displayName: v.optional(v.string()),
  name: v.optional(v.string()),
  rating: v.optional(v.number()),
});

export const listLookingForOpponent = query({
  args: {},
  returns: v.array(
    v.object({
      game: v.object({
        _id: v.id("games"),
        baseTimeMs: v.optional(v.number()),
        incrementMs: v.optional(v.number()),
        timeControlCategory: v.optional(v.string()),
        status: v.string(),
        matchSource: v.optional(v.literal("quick_pair")),
      }),
      host: v.union(hostSummary, v.null()),
      isOwnGame: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();

    const candidates = await ctx.db
      .query("games")
      .withIndex("by_status_and_matchSource", (q) =>
        q.eq("status", "waiting").eq("matchSource", "quick_pair"),
      )
      .order("desc")
      .take(20);

    const openGames = candidates.filter(
      (game) =>
        !game.blackUserId &&
        !game.blackGuestName &&
        game.inviteExpiresAt > now,
    );

    return await Promise.all(
      openGames.map(async (game) => {
        const hostId = game.whiteUserId ?? game.createdByUserId;
        let host: Doc<"users"> | null = null;
        if (hostId) {
          host = await ctx.db.get(hostId);
        }

        return {
          game: {
            _id: game._id,
            baseTimeMs: game.baseTimeMs,
            incrementMs: game.incrementMs,
            timeControlCategory: game.timeControlCategory,
            status: game.status,
            matchSource: game.matchSource,
          },
          host: host
            ? {
                _id: host._id,
                displayName: host.displayName,
                name: host.name,
                rating: host.rating,
              }
            : null,
          isOwnGame: hostId === user._id,
        };
      }),
    );
  },
});

export const cancelQuickPair = mutation({
  args: {
    gameId: v.optional(v.id("games")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.gameId) {
      const game = await ctx.db.get(args.gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.status !== "waiting" || game.matchSource !== "quick_pair") {
        throw new Error("Game is not a quick-pair lobby game");
      }
      if (game.whiteUserId !== user._id && game.createdByUserId !== user._id) {
        throw new Error("You cannot cancel this game");
      }
      await ctx.db.patch(game._id, {
        status: "abandoned",
        endReason: "cancelled",
        updatedAt: Date.now(),
      });
      return null;
    }

    await abandonQuickPairWaitingGames(ctx, user._id);
    return null;
  },
});
