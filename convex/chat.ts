import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isParticipant } from "./lib/games";

export const list = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
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
        return { ...msg, senderName };
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
    if (!isParticipant(game, userId, args.guestSessionId ?? null)) {
      throw new Error("You are not a participant in this game");
    }

    await ctx.db.insert("gameMessages", {
      gameId: args.gameId,
      senderUserId: userId ?? undefined,
      senderGuestName: userId ? undefined : args.guestName,
      senderGuestSessionId: userId ? undefined : args.guestSessionId,
      body,
      createdAt: Date.now(),
    });
  },
});
