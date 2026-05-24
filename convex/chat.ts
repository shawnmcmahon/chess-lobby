import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { canChatInGame, canViewGame, inferMessageSenderRole } from "./lib/games";

const chatMessageValidator = v.object({
  _id: v.id("gameMessages"),
  _creationTime: v.number(),
  gameId: v.id("games"),
  senderUserId: v.optional(v.id("users")),
  senderGuestName: v.optional(v.string()),
  senderGuestSessionId: v.optional(v.string()),
  senderRole: v.optional(v.union(v.literal("player"), v.literal("observer"))),
  body: v.string(),
  createdAt: v.number(),
  senderName: v.string(),
  senderRoleResolved: v.union(v.literal("player"), v.literal("observer")),
});

export const list = query({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.array(chatMessageValidator),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return [];
    }

    const userId = await getAuthUserId(ctx);
    if (!canViewGame(game, userId, args.guestSessionId ?? null)) {
      return [];
    }

    const messages = await ctx.db
      .query("gameMessages")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        let senderName = msg.senderGuestName ?? "Player";
        if (msg.senderUserId) {
          const user = await ctx.db.get(msg.senderUserId);
          senderName = user?.displayName ?? user?.name ?? user?.email ?? "Player";
        }
        const senderRoleResolved = inferMessageSenderRole(game, msg);
        return {
          ...msg,
          senderName,
          senderRoleResolved,
        };
      }),
    );
  },
});

export const send = mutation({
  args: {
    gameId: v.id("games"),
    body: v.string(),
    guestSessionId: v.optional(v.string()),
    guestName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const body = args.body.trim();
    if (!body) {
      throw new Error("Message cannot be empty");
    }

    const userId = await getAuthUserId(ctx);
    if (!canViewGame(game, userId, args.guestSessionId ?? null)) {
      throw new Error("You cannot view this game");
    }

    const senderRole = canChatInGame(game, userId, args.guestSessionId ?? null);
    if (!senderRole) {
      throw new Error("You cannot send messages in this game");
    }
    if (game.isPublic === false && senderRole === "observer") {
      throw new Error("You cannot send messages in this game");
    }

    await ctx.db.insert("gameMessages", {
      gameId: args.gameId,
      senderUserId: userId ?? undefined,
      senderGuestName: userId ? undefined : args.guestName,
      senderGuestSessionId: userId ? undefined : args.guestSessionId,
      senderRole,
      body,
      createdAt: Date.now(),
    });

    return null;
  },
});
