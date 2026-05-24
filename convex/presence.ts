import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  canViewGame,
  isParticipant,
  isSessionOnline,
  listTrackedParticipantKeys,
  participantSessionKey,
} from "./lib/games";

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

async function upsertSpectatorSession(
  ctx: MutationCtx,
  gameId: Id<"games">,
  spectatorKey: string,
  lastSeenAt: number,
  guestName?: string,
): Promise<void> {
  const existing = await ctx.db
    .query("gameSpectatorSessions")
    .withIndex("by_game_and_spectator", (q) =>
      q.eq("gameId", gameId).eq("spectatorKey", spectatorKey),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      lastSeenAt,
      ...(guestName !== undefined ? { guestName } : {}),
    });
    return;
  }

  await ctx.db.insert("gameSpectatorSessions", {
    gameId,
    spectatorKey,
    guestName,
    lastSeenAt,
  });
}

async function deleteSpectatorSession(
  ctx: MutationCtx,
  gameId: Id<"games">,
  spectatorKey: string,
): Promise<void> {
  const existing = await ctx.db
    .query("gameSpectatorSessions")
    .withIndex("by_game_and_spectator", (q) =>
      q.eq("gameId", gameId).eq("spectatorKey", spectatorKey),
    )
    .unique();

  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

export const pingSpectatorSession = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
    guestName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.isPublic === false) {
      return null;
    }
    if (game.status !== "waiting" && game.status !== "active") {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    if (isParticipant(game, userId, args.guestSessionId ?? null)) {
      return null;
    }
    if (!canViewGame(game, userId, args.guestSessionId ?? null)) {
      return null;
    }

    const spectatorKey = participantSessionKey(userId, args.guestSessionId ?? null);
    if (!spectatorKey) {
      return null;
    }

    await upsertSpectatorSession(
      ctx,
      args.gameId,
      spectatorKey,
      Date.now(),
      args.guestName,
    );
    return null;
  },
});

export const leaveSpectatorSession = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const spectatorKey = participantSessionKey(userId, args.guestSessionId ?? null);
    if (!spectatorKey) {
      return null;
    }

    await deleteSpectatorSession(ctx, args.gameId, spectatorKey);
    return null;
  },
});

const gameObserverValidator = v.object({
  key: v.string(),
  userId: v.optional(v.id("users")),
  guestSessionId: v.optional(v.string()),
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

    const participantKeys = new Set(listTrackedParticipantKeys(game));
    const now = Date.now();
    const sessions = await ctx.db
      .query("gameSpectatorSessions")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const observers = sessions.filter(
      (session) =>
        isSessionOnline(session.lastSeenAt, now) &&
        !participantKeys.has(session.spectatorKey),
    );

    return await Promise.all(
      observers.map(async (session) => {
        if (session.spectatorKey.startsWith("user:")) {
          const observerUserId = session.spectatorKey.slice(5) as Id<"users">;
          const user = await ctx.db.get(observerUserId);
          return {
            key: session.spectatorKey,
            userId: observerUserId,
            displayName:
              user?.displayName ?? user?.name ?? user?.email ?? "Observer",
            online: true,
          };
        }

        const guestSessionId = session.spectatorKey.slice(6);
        return {
          key: session.spectatorKey,
          guestSessionId,
          displayName: session.guestName ?? "Spectator",
          online: true,
        };
      }),
    );
  },
});
