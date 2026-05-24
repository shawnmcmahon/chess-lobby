import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { applyMove, applyUciMove, STARTING_FEN } from "./lib/chess";
import {
  buildClearDisconnectPatch,
  buildStartDisconnectPatch,
  canViewGame,
  colorForParticipantKey,
  generateInviteToken,
  getDisconnectDeadlineAt,
  isLiveSessionGame,
  isParticipant,
  isSessionOnline,
  isSpectateEligible,
  listTrackedParticipantKeys,
  participantSessionKey,
  playerColorForUser,
} from "./lib/games";
import { getCurrentUserOrNull } from "./lib/auth";
import { recordGameStats } from "./lib/stats";
import { playType } from "./schema";
import {
  categorizeTimeControl,
  computeTurnDeadline,
  type TimeControlCategory,
} from "./lib/timeControl";
import {
  FIRST_MOVE_MS,
  buildLiveGameActivationPatch,
  firstMoveDeadlineExpired,
  isInFirstMovePhase,
  timedEngineGameStartFields,
} from "./lib/liveClock";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { PaginationOptions } from "convex/server";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const DISCONNECT_RESOLUTION_DELAY_MS = 5_000;

async function paginateFinishedGamesForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
  paginationOpts: PaginationOptions,
) {
  const whiteFinished = await ctx.db
    .query("games")
    .withIndex("by_whiteUser_and_status", (q) =>
      q.eq("whiteUserId", userId).eq("status", "finished"),
    )
    .order("desc")
    .collect();

  const blackFinished = await ctx.db
    .query("games")
    .withIndex("by_blackUser_and_status", (q) =>
      q.eq("blackUserId", userId).eq("status", "finished"),
    )
    .order("desc")
    .collect();

  const seen = new Set<string>();
  const merged = [...whiteFinished, ...blackFinished]
    .filter((game) => {
      if (seen.has(game._id)) return false;
      seen.add(game._id);
      return true;
    })
    .sort((a, b) => b._creationTime - a._creationTime);

  const start = paginationOpts.cursor
    ? Number.parseInt(paginationOpts.cursor, 10)
    : 0;
  const numItems = paginationOpts.numItems;
  const page = merged.slice(start, start + numItems);
  const next = start + numItems;

  return {
    page,
    isDone: next >= merged.length,
    continueCursor: next >= merged.length ? "" : String(next),
  };
}

async function finishGame(
  ctx: MutationCtx,
  gameId: Id<"games">,
  updates: {
    winner?: "white" | "black";
    endReason: string;
  },
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game || game.status === "finished" || game.status === "abandoned") {
    return;
  }

  const now = Date.now();
  await ctx.db.patch(gameId, {
    status: "finished",
    winner: updates.winner,
    endReason: updates.endReason,
    updatedAt: now,
  });

  const finished = await ctx.db.get(gameId);
  if (finished) {
    await recordGameStats(ctx, finished);
  }

  await clearParticipantSessions(ctx, gameId);
}

async function abandonGame(
  ctx: MutationCtx,
  gameId: Id<"games">,
  endReason = "abandoned",
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game || game.status === "finished" || game.status === "abandoned") {
    return;
  }

  await ctx.db.patch(gameId, {
    status: "abandoned",
    endReason,
    updatedAt: Date.now(),
  });

  await clearParticipantSessions(ctx, gameId);
}

async function clearParticipantSessions(
  ctx: MutationCtx,
  gameId: Id<"games">,
): Promise<void> {
  const sessions = await ctx.db
    .query("gameParticipantSessions")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();

  for (const session of sessions) {
    await ctx.db.delete(session._id);
  }
}

async function upsertParticipantSession(
  ctx: MutationCtx,
  gameId: Id<"games">,
  participantKey: string,
  lastSeenAt: number,
): Promise<void> {
  const existing = await ctx.db
    .query("gameParticipantSessions")
    .withIndex("by_game_and_participant", (q) =>
      q.eq("gameId", gameId).eq("participantKey", participantKey),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { lastSeenAt });
    return;
  }

  await ctx.db.insert("gameParticipantSessions", {
    gameId,
    participantKey,
    lastSeenAt,
  });
}

async function startPlayerDisconnect(
  ctx: MutationCtx,
  gameId: Id<"games">,
  color: "white" | "black",
  now: number,
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game) {
    return;
  }
  if (getDisconnectDeadlineAt(game, color) !== undefined) {
    return;
  }

  const patch = buildStartDisconnectPatch(game, color, now);
  await ctx.db.patch(gameId, {
    ...patch,
    updatedAt: now,
  });
}

async function clearPlayerDisconnect(
  ctx: MutationCtx,
  gameId: Id<"games">,
  color: "white" | "black",
  now: number,
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game) {
    return;
  }

  const patch = buildClearDisconnectPatch(game, color, now);
  if (Object.keys(patch).length === 0) {
    return;
  }

  await ctx.db.patch(gameId, {
    ...patch,
    updatedAt: now,
  });
}

async function getSessionsForGame(ctx: QueryCtx, gameId: Id<"games">) {
  return await ctx.db
    .query("gameParticipantSessions")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();
}

async function markStaleSessionsDisconnected(
  ctx: MutationCtx,
  gameId: Id<"games">,
  now: number,
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game || !isLiveSessionGame(game)) {
    return;
  }
  if (game.status !== "waiting" && game.status !== "active") {
    return;
  }

  const sessions = await getSessionsForGame(ctx, gameId);
  for (const participantKey of listTrackedParticipantKeys(game)) {
    const color = colorForParticipantKey(game, participantKey);
    if (!color) {
      continue;
    }
    if (getDisconnectDeadlineAt(game, color) !== undefined) {
      continue;
    }

    const session = sessions.find((entry) => entry.participantKey === participantKey);
    if (session && !isSessionOnline(session.lastSeenAt, now)) {
      await startPlayerDisconnect(ctx, gameId, color, now);
      await ctx.db.delete(session._id);
    }
  }
}

async function resolveSessionDisconnectForGame(
  ctx: MutationCtx,
  gameId: Id<"games">,
): Promise<void> {
  const game = await ctx.db.get(gameId);
  if (!game || !isLiveSessionGame(game)) {
    return;
  }
  if (game.status === "finished" || game.status === "abandoned") {
    return;
  }

  const now = Date.now();

  if (game.status === "waiting") {
    const whiteDeadline = game.whiteDisconnectDeadlineAt;
    if (whiteDeadline !== undefined && now >= whiteDeadline) {
      await abandonGame(ctx, gameId, "left_waiting");
    }
    return;
  }

  if (game.status !== "active") {
    return;
  }

  if (game.mode === "human_vs_engine") {
    const whiteDeadline = game.whiteDisconnectDeadlineAt;
    if (whiteDeadline !== undefined && now >= whiteDeadline) {
      await abandonGame(ctx, gameId, "left_engine");
    }
    return;
  }

  const whiteExpired =
    game.whiteDisconnectDeadlineAt !== undefined &&
    now >= game.whiteDisconnectDeadlineAt;
  const blackExpired =
    game.blackDisconnectDeadlineAt !== undefined &&
    now >= game.blackDisconnectDeadlineAt;

  if (!whiteExpired && !blackExpired) {
    return;
  }

  if (whiteExpired && blackExpired) {
    await abandonGame(ctx, gameId, "all_left");
    return;
  }

  const loser = whiteExpired ? "white" : "black";
  const winner = loser === "white" ? "black" : "white";
  await finishGame(ctx, gameId, { winner, endReason: "disconnect" });
}

function clockStartTimestamp(game: Doc<"games">): number {
  return game.lastMoveAt ?? game.createdAt;
}

function applyClockForMove(
  game: Doc<"games">,
  movingColor: "white" | "black",
  now: number,
): {
  whiteTimeMs?: number;
  blackTimeMs?: number;
  forfeit?: "white" | "black";
} {
  if (game.playType === "correspondence" || game.baseTimeMs === undefined) {
    return {};
  }
  if (isInFirstMovePhase(game)) {
    return {};
  }

  const elapsed = now - clockStartTimestamp(game);
  const whiteTime = game.whiteTimeMs ?? game.baseTimeMs;
  const blackTime = game.blackTimeMs ?? game.baseTimeMs;

  if (movingColor === "white") {
    const remaining = whiteTime - elapsed;
    if (remaining <= 0) {
      return { forfeit: "white" };
    }
    const afterIncrement = remaining + (game.incrementMs ?? 0);
    return { whiteTimeMs: afterIncrement, blackTimeMs: blackTime };
  }

  const remaining = blackTime - elapsed;
  if (remaining <= 0) {
    return { forfeit: "black" };
  }
  const afterIncrement = remaining + (game.incrementMs ?? 0);
  return { whiteTimeMs: whiteTime, blackTimeMs: afterIncrement };
}

export const get = query({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    if (!canViewGame(game, userId, args.guestSessionId ?? null)) {
      return null;
    }

    return game;
  },
});

export const getForReview = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "finished") {
      return null;
    }

    if (game.whiteUserId !== userId && game.blackUserId !== userId) {
      return null;
    }

    return game;
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
    playType: v.optional(playType),
    baseTimeMs: v.optional(v.number()),
    incrementMs: v.optional(v.number()),
    daysPerTurn: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const inviteToken = generateInviteToken();
    const difficulty = args.engineDifficulty ?? 10;
    const play = args.playType ?? "live";
    const incrementMs = args.incrementMs ?? 0;

    let category: TimeControlCategory | undefined;
    if (play === "correspondence") {
      category = "correspondence";
    } else if (args.baseTimeMs !== undefined) {
      category = categorizeTimeControl(args.baseTimeMs, incrementMs);
    }

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
      ...(args.mode === "human_vs_engine" &&
      play === "live" &&
      args.baseTimeMs !== undefined
        ? timedEngineGameStartFields(now)
        : { lastMoveAt: now }),
      isPublic: args.isPublic ?? true,
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
        ...buildLiveGameActivationPatch(game, now),
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
      ...buildLiveGameActivationPatch(game, now),
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

    const now = Date.now();
    const inFirstMovePhase = isInFirstMovePhase(game);

    if (inFirstMovePhase && firstMoveDeadlineExpired(game, now)) {
      await abandonGame(ctx, args.gameId, "first_move_timeout");
      return args.gameId;
    }

    const clock = inFirstMovePhase
      ? {}
      : applyClockForMove(game, color, now);
    if ("forfeit" in clock && clock.forfeit) {
      const winner = clock.forfeit === "white" ? "black" : "white";
      await finishGame(ctx, args.gameId, {
        winner,
        endReason: "timeout",
      });
      return args.gameId;
    }

    const result = applyMove(game.fen, args.from, args.to, args.promotion);

    const updates: Record<string, unknown> = {
      fen: result.fen,
      pgn: result.pgn,
      currentTurn: result.currentTurn,
      updatedAt: now,
    };

    if (inFirstMovePhase) {
      if (color === "white") {
        updates.firstMoveDeadlineAt = now + FIRST_MOVE_MS;
      } else {
        updates.mainClockStarted = true;
        updates.firstMoveDeadlineAt = undefined;
        updates.lastMoveAt = now;
      }
    } else {
      updates.lastMoveAt = now;
      updates.whiteTimeMs = clock.whiteTimeMs ?? game.whiteTimeMs;
      updates.blackTimeMs = clock.blackTimeMs ?? game.blackTimeMs;
    }

    if (
      game.playType === "correspondence" &&
      game.daysPerTurn !== undefined
    ) {
      updates.turnDeadlineAt = computeTurnDeadline(now, game.daysPerTurn);
    }

    if (result.isGameOver) {
      await ctx.db.patch(args.gameId, updates);
      await finishGame(ctx, args.gameId, {
        winner: result.winner,
        endReason: result.endReason ?? "game_over",
      });
    } else {
      await ctx.db.patch(args.gameId, updates);
    }

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
    await finishGame(ctx, args.gameId, { winner, endReason: "resign" });
  },
});

export const cancelWaitingGame = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Game is not waiting");
    }

    const userId = await getAuthUserId(ctx);
    const isHost =
      (userId !== null &&
        (game.createdByUserId === userId || game.whiteUserId === userId)) ||
      (args.guestSessionId !== undefined &&
        game.whiteGuestSessionId === args.guestSessionId);
    if (!isHost) {
      throw new Error("You cannot cancel this game");
    }

    await abandonGame(ctx, args.gameId, "cancelled");
    return null;
  },
});

export const saveAnalysis = mutation({
  args: {
    gameId: v.id("games"),
    analysisJson: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "finished") {
      throw new Error("Game is not finished");
    }

    const color = playerColorForUser(game, userId, null);
    if (!color) {
      throw new Error("You are not a participant in this game");
    }

    await ctx.db.patch(args.gameId, {
      analysisJson: args.analysisJson,
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

    const now = Date.now();
    const inFirstMovePhase = isInFirstMovePhase(game);

    const clock = inFirstMovePhase
      ? {}
      : applyClockForMove(game, "black", now);
    if ("forfeit" in clock && clock.forfeit) {
      await finishGame(ctx, args.gameId, {
        winner: "white",
        endReason: "timeout",
      });
      return;
    }

    const result = applyUciMove(game.fen, args.uci);
    const updates: Record<string, unknown> = {
      fen: result.fen,
      pgn: result.pgn,
      currentTurn: result.currentTurn,
      updatedAt: now,
    };

    if (inFirstMovePhase) {
      updates.mainClockStarted = true;
      updates.firstMoveDeadlineAt = undefined;
      updates.lastMoveAt = now;
    } else {
      updates.lastMoveAt = now;
      updates.whiteTimeMs = clock.whiteTimeMs ?? game.whiteTimeMs;
      updates.blackTimeMs = clock.blackTimeMs ?? game.blackTimeMs;
    }

    if (result.isGameOver) {
      await ctx.db.patch(args.gameId, updates);
      await finishGame(ctx, args.gameId, {
        winner: result.winner,
        endReason: result.endReason ?? "game_over",
      });
    } else {
      await ctx.db.patch(args.gameId, updates);
    }
  },
});

export const setEngineError = internalMutation({
  args: {
    gameId: v.id("games"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.mode !== "human_vs_engine") {
      return;
    }
    await abandonGame(ctx, args.gameId, `engine_error: ${args.message}`);
  },
});

export const processLiveTimeouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(100);

    const now = Date.now();
    let processed = 0;

    for (const game of activeGames) {
      if (game.playType === "correspondence" || game.baseTimeMs === undefined) {
        continue;
      }

      if (isInFirstMovePhase(game)) {
        if (firstMoveDeadlineExpired(game, now)) {
          await abandonGame(ctx, game._id, "first_move_timeout");
          processed += 1;
        }
        continue;
      }

      const movingColor = game.currentTurn;
      const elapsed = now - clockStartTimestamp(game);
      const timeMs =
        movingColor === "white"
          ? (game.whiteTimeMs ?? game.baseTimeMs)
          : (game.blackTimeMs ?? game.baseTimeMs);

      if (elapsed >= timeMs) {
        const winner = movingColor === "white" ? "black" : "white";
        await finishGame(ctx, game._id, { winner, endReason: "timeout" });
        processed += 1;
      }
    }

    return { processed };
  },
});

export const processCorrespondenceTimeouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(100);

    const now = Date.now();
    let processed = 0;

    for (const game of activeGames) {
      if (
        game.playType !== "correspondence" ||
        game.turnDeadlineAt === undefined
      ) {
        continue;
      }

      if (now > game.turnDeadlineAt) {
        const winner = game.currentTurn === "white" ? "black" : "white";
        await finishGame(ctx, game._id, { winner, endReason: "timeout" });
        processed += 1;
      }
    }

    return { processed };
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

export const listMyFinished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return paginateFinishedGamesForUser(ctx, user._id, args.paginationOpts);
  },
});

export const listActiveForSpectate = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const take = args.limit ?? 20;
    const now = Date.now();
    const candidates = await ctx.db
      .query("games")
      .withIndex("by_status_and_public", (q) =>
        q.eq("status", "active").eq("isPublic", true),
      )
      .order("desc")
      .take(take * 3);

    const eligible: Doc<"games">[] = [];
    for (const game of candidates) {
      const sessions = await getSessionsForGame(ctx, game._id);
      if (isSpectateEligible(game, sessions, now)) {
        eligible.push(game);
      }
      if (eligible.length >= take) {
        break;
      }
    }

    return await Promise.all(
      eligible.map(async (game) => {
        const whiteUser = game.whiteUserId
          ? await ctx.db.get(game.whiteUserId)
          : null;
        const blackUser = game.blackUserId
          ? await ctx.db.get(game.blackUserId)
          : null;
        return {
          game,
          whiteName:
            game.whiteGuestName ??
            whiteUser?.displayName ??
            whiteUser?.name ??
            "White",
          blackName:
            game.blackGuestName ??
            blackUser?.displayName ??
            blackUser?.name ??
            (game.mode === "human_vs_engine" ? "Computer" : "Black"),
        };
      }),
    );
  },
});

async function countSpectateEligibleGames(ctx: QueryCtx): Promise<number> {
  const now = Date.now();
  const candidates = await ctx.db
    .query("games")
    .withIndex("by_status_and_public", (q) =>
      q.eq("status", "active").eq("isPublic", true),
    )
    .take(500);

  let count = 0;
  for (const game of candidates) {
    const sessions = await getSessionsForGame(ctx, game._id);
    if (isSpectateEligible(game, sessions, now)) {
      count += 1;
    }
  }
  return count;
}

export const getLobbyCounts = query({
  args: { onlineCount: v.number() },
  handler: async (ctx, args) => {
    const inPlayCount = await countSpectateEligibleGames(ctx);

    return {
      onlineCount: args.onlineCount,
      inPlayCount,
    };
  },
});

export const listFinishedForUser = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return paginateFinishedGamesForUser(ctx, args.userId, args.paginationOpts);
  },
});

export const pingParticipantSession = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !isLiveSessionGame(game)) {
      return null;
    }
    if (game.status !== "waiting" && game.status !== "active") {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    if (!isParticipant(game, userId, args.guestSessionId ?? null)) {
      throw new Error("You are not a participant in this game");
    }

    const participantKey = participantSessionKey(userId, args.guestSessionId ?? null);
    if (!participantKey) {
      throw new Error("Could not identify participant session");
    }

    const color = playerColorForUser(game, userId, args.guestSessionId ?? null);
    if (color) {
      await clearPlayerDisconnect(ctx, args.gameId, color, Date.now());
    }

    await upsertParticipantSession(ctx, args.gameId, participantKey, Date.now());
    return null;
  },
});

export const leaveParticipantSession = mutation({
  args: {
    gameId: v.id("games"),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !isLiveSessionGame(game)) {
      return null;
    }
    if (game.status !== "waiting" && game.status !== "active") {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    if (!isParticipant(game, userId, args.guestSessionId ?? null)) {
      return null;
    }

    const participantKey = participantSessionKey(userId, args.guestSessionId ?? null);
    if (!participantKey) {
      return null;
    }

    const color = playerColorForUser(game, userId, args.guestSessionId ?? null);
    const now = Date.now();
    if (color) {
      await startPlayerDisconnect(ctx, args.gameId, color, now);
    }

    const existing = await ctx.db
      .query("gameParticipantSessions")
      .withIndex("by_game_and_participant", (q) =>
        q.eq("gameId", args.gameId).eq("participantKey", participantKey),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.scheduler.runAfter(
      DISCONNECT_RESOLUTION_DELAY_MS,
      internal.games.applySessionDisconnect,
      {
        gameId: args.gameId,
      },
    );

    return null;
  },
});

export const applySessionDisconnect = internalMutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveSessionDisconnectForGame(ctx, args.gameId);
    return null;
  },
});

export const processInactiveGameSessions = internalMutation({
  args: {},
  returns: v.object({ processed: v.number() }),
  handler: async (ctx) => {
    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(100);
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(100);

    const candidates = [...waitingGames, ...activeGames].filter(isLiveSessionGame);
    let processed = 0;

    for (const game of candidates) {
      const before = game.status;
      await markStaleSessionsDisconnected(ctx, game._id, Date.now());
      await resolveSessionDisconnectForGame(ctx, game._id);
      const after = await ctx.db.get(game._id);
      if (after && after.status !== before) {
        processed += 1;
      }
    }

    return { processed };
  },
});

export const processExpiredWaitingGames = internalMutation({
  args: {},
  returns: v.object({ processed: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const waitingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(100);

    let processed = 0;

    for (const game of waitingGames) {
      const before = game.status;

      if (now > game.inviteExpiresAt) {
        await abandonGame(ctx, game._id, "invite_expired");
      } else if (isLiveSessionGame(game)) {
        await resolveSessionDisconnectForGame(ctx, game._id);
      }

      const after = await ctx.db.get(game._id);
      if (after && after.status !== before) {
        processed += 1;
      }
    }

    return { processed };
  },
});
