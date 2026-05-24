import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { canViewGame, isParticipant } from "./lib/games";

export const presence = new Presence(components.presence);

export const getUserId = query({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    if (args.userId !== authUserId) {
      throw new Error("Invalid user id for presence");
    }
    return await presence.heartbeat(
      ctx,
      args.roomId,
      args.userId,
      args.sessionId,
      args.interval,
    );
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

const gameObserverValidator = v.object({
  userId: v.id("users"),
  displayName: v.string(),
  online: v.boolean(),
});

export const listGameObservers = query({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.array(gameObserverValidator),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return [];
    }

    const userId = await getAuthUserId(ctx);
    if (!canViewGame(game, userId, args.guestSessionId ?? null)) {
      return [];
    }
    if (
      game.isPublic === false &&
      !isParticipant(game, userId, args.guestSessionId ?? null)
    ) {
      return [];
    }

    const participantIds = new Set<Id<"users">>(
      [game.whiteUserId, game.blackUserId].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    );

    const roomToken = `game:${args.gameId}:spectators`;
    const present = await presence.list(ctx, roomToken);

    const observers = present.filter(
      (entry) =>
        entry.online &&
        entry.userId &&
        !participantIds.has(entry.userId as Id<"users">),
    );

    return await Promise.all(
      observers.map(async (entry) => {
        const userId = entry.userId as Id<"users">;
        const user = await ctx.db.get(userId);
        return {
          userId,
          displayName: user?.displayName ?? user?.name ?? user?.email ?? "Observer",
          online: entry.online,
        };
      }),
    );
  },
});
