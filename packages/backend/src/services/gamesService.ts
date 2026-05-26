import { applyMove, STARTING_FEN } from "../lib/chess.js";
import {
  canViewGame,
  generateInviteToken,
  playerColorForUser,
} from "../lib/games.js";
import {
  buildLiveGameActivationPatch,
  firstMoveDeadlineExpired,
  isInFirstMovePhase,
  timedEngineGameStartFields,
  FIRST_MOVE_MS,
} from "../lib/liveClock.js";
import { categorizeTimeControl, computeTurnDeadline, type TimeControlCategory } from "../lib/timeControl.js";
import type { RequestContext } from "../types/api.js";
import type { Game, GameId, GameMode, PlayType, UserId } from "../types/domain.js";
import { gamesRepository } from "../db/repositories/gamesRepository.js";
import { usersRepository } from "../db/repositories/usersRepository.js";
import {
  CHANNELS,
  subscriptionKeysForGameChange,
} from "../realtime/channels.js";
import { fanOutQueryUpdate } from "../realtime/push.js";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function clockStartTimestamp(game: Game): number {
  return game.lastMoveAt ?? game.createdAt;
}

function applyClockForMove(
  game: Game,
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
    return {
      whiteTimeMs: remaining + (game.incrementMs ?? 0),
      blackTimeMs: blackTime,
    };
  }

  const remaining = blackTime - elapsed;
  if (remaining <= 0) {
    return { forfeit: "black" };
  }
  return {
    whiteTimeMs: whiteTime,
    blackTimeMs: remaining + (game.incrementMs ?? 0),
  };
}

async function finishGame(
  gameId: GameId,
  updates: { winner?: "white" | "black"; endReason: string },
  now: number,
): Promise<void> {
  const game = await gamesRepository.getById(gameId);
  if (!game || game.status === "finished" || game.status === "abandoned") {
    return;
  }

  await gamesRepository.patch(gameId, {
    status: "finished",
    winner: updates.winner,
    endReason: updates.endReason,
    updatedAt: now,
  });

  const finished = await gamesRepository.getById(gameId);
  if (finished) {
    // TODO: persist stats via UserStatsRepository (see convex/lib/stats.ts).
    void finished;
  }

  await notifyGameChange(gameId);
}

async function abandonGame(
  gameId: GameId,
  endReason: string,
  now: number,
): Promise<void> {
  const game = await gamesRepository.getById(gameId);
  if (!game || game.status === "finished" || game.status === "abandoned") {
    return;
  }

  await gamesRepository.patch(gameId, {
    status: "abandoned",
    endReason,
    updatedAt: now,
  });
  await notifyGameChange(gameId);
}

async function notifyGameChange(gameId: GameId): Promise<void> {
  const game = await gamesRepository.getById(gameId);
  if (!game) return;

  for (const key of subscriptionKeysForGameChange(gameId)) {
    if (key === `game:${gameId}`) {
      await fanOutQueryUpdate(key, CHANNELS.gamesGet, game);
    }
  }
}

export async function gamesGet(
  ctx: RequestContext,
  args: { gameId: GameId; guestSessionId?: string },
): Promise<Game | null> {
  const game = await gamesRepository.getById(args.gameId);
  if (!game) return null;

  if (!canViewGame(game, ctx.userId, args.guestSessionId ?? ctx.guestSessionId)) {
    return null;
  }

  return game;
}

export async function gamesCreate(
  ctx: RequestContext,
  args: {
    mode: GameMode;
    engineDifficulty?: number;
    playType?: PlayType;
    baseTimeMs?: number;
    incrementMs?: number;
    daysPerTurn?: number;
    isPublic?: boolean;
  },
): Promise<{ gameId: GameId; inviteToken: string }> {
  if (!ctx.userId) {
    throw new Error("Not authenticated");
  }

  const now = ctx.now;
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

  const gameId = await gamesRepository.insert({
    status: args.mode === "human_vs_engine" ? "active" : "waiting",
    mode: args.mode,
    fen: STARTING_FEN,
    currentTurn: "white",
    whiteUserId: ctx.userId,
    inviteToken,
    inviteExpiresAt: now + INVITE_TTL_MS,
    engineDifficulty: args.mode === "human_vs_engine" ? difficulty : undefined,
    createdByUserId: ctx.userId,
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

  await notifyGameChange(gameId);
  return { gameId, inviteToken };
}

export async function gamesMakeMove(
  ctx: RequestContext,
  args: {
    gameId: GameId;
    from: string;
    to: string;
    promotion?: string;
    guestSessionId?: string;
  },
): Promise<GameId> {
  const game = await gamesRepository.getById(args.gameId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "active") throw new Error("Game is not active");

  const guestSessionId = args.guestSessionId ?? ctx.guestSessionId;
  const color = playerColorForUser(game, ctx.userId, guestSessionId);
  if (!color) throw new Error("You are not a participant in this game");
  if (game.currentTurn !== color) throw new Error("Not your turn");

  const now = ctx.now;
  const inFirstMovePhase = isInFirstMovePhase(game);

  if (inFirstMovePhase && firstMoveDeadlineExpired(game, now)) {
    await abandonGame(args.gameId, "first_move_timeout", now);
    return args.gameId;
  }

  const clock = inFirstMovePhase ? {} : applyClockForMove(game, color, now);
  if ("forfeit" in clock && clock.forfeit) {
    const winner = clock.forfeit === "white" ? "black" : "white";
    await finishGame(args.gameId, { winner, endReason: "timeout" }, now);
    return args.gameId;
  }

  const result = applyMove(game.fen, args.from, args.to, args.promotion);
  const updates: Partial<Game> = {
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

  if (game.playType === "correspondence" && game.daysPerTurn !== undefined) {
    updates.turnDeadlineAt = computeTurnDeadline(now, game.daysPerTurn);
  }

  if (result.isGameOver) {
    await gamesRepository.patch(args.gameId, updates);
    await finishGame(
      args.gameId,
      { winner: result.winner, endReason: result.endReason ?? "game_over" },
      now,
    );
  } else {
    await gamesRepository.patch(args.gameId, updates);
    await notifyGameChange(args.gameId);

    if (
      game.mode === "human_vs_engine" &&
      result.currentTurn === "black"
    ) {
      // Engine move scheduled via SQS in handler layer (replaces ctx.scheduler.runAfter).
    }
  }

  return args.gameId;
}

export async function usersCurrent(ctx: RequestContext) {
  return getCurrentUser(ctx);
}

async function getCurrentUser(ctx: RequestContext) {
  if (!ctx.userId) return null;
  return usersRepository.getById(ctx.userId);
}

export const gamesService = {
  get: gamesGet,
  create: gamesCreate,
  makeMove: gamesMakeMove,
};

export const usersService = {
  current: usersCurrent,
};
