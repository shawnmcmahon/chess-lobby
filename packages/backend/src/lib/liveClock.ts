import type { Game } from "../types/domain.js";

export const FIRST_MOVE_MS = 30_000;

export function isTimedLiveGame(
  game: Pick<Game, "playType" | "baseTimeMs">,
): boolean {
  return game.playType !== "correspondence" && game.baseTimeMs !== undefined;
}

export function isInFirstMovePhase(
  game: Pick<Game, "playType" | "baseTimeMs" | "mainClockStarted">,
): boolean {
  return isTimedLiveGame(game) && game.mainClockStarted === false;
}

export function timedEngineGameStartFields(now: number): {
  mainClockStarted: false;
  firstMoveDeadlineAt: number;
} {
  return {
    mainClockStarted: false,
    firstMoveDeadlineAt: now + FIRST_MOVE_MS,
  };
}

export function timedLiveGameActivationFields(now: number): {
  mainClockStarted: false;
  firstMoveDeadlineAt: number;
} {
  return {
    mainClockStarted: false,
    firstMoveDeadlineAt: now + FIRST_MOVE_MS,
  };
}

export function firstMoveDeadlineExpired(
  game: Pick<Game, "firstMoveDeadlineAt">,
  now: number,
): boolean {
  return game.firstMoveDeadlineAt !== undefined && now > game.firstMoveDeadlineAt;
}

export function buildLiveGameActivationPatch(
  game: Pick<Game, "playType" | "baseTimeMs">,
  now: number,
): {
  status: "active";
  updatedAt: number;
  mainClockStarted?: false;
  firstMoveDeadlineAt?: number;
  lastMoveAt?: number;
} {
  if (isTimedLiveGame(game)) {
    return {
      status: "active",
      updatedAt: now,
      ...timedLiveGameActivationFields(now),
    };
  }
  return {
    status: "active",
    updatedAt: now,
    lastMoveAt: now,
  };
}
