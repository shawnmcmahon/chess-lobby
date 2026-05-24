import type { Doc } from "../_generated/dataModel";

export const FIRST_MOVE_MS = 30_000;

export function isTimedLiveGame(game: Pick<Doc<"games">, "playType" | "baseTimeMs">): boolean {
  return game.playType !== "correspondence" && game.baseTimeMs !== undefined;
}

export function isInFirstMovePhase(
  game: Pick<Doc<"games">, "playType" | "baseTimeMs" | "mainClockStarted">,
): boolean {
  return isTimedLiveGame(game) && game.mainClockStarted === false;
}

/** Patch fields when a live timed game becomes active (both players seated). */
export function timedLiveGameActivationFields(now: number): {
  mainClockStarted: false;
  firstMoveDeadlineAt: number;
} {
  return {
    mainClockStarted: false,
    firstMoveDeadlineAt: now + FIRST_MOVE_MS,
  };
}

/** Patch fields when a live timed vs-engine game is created. */
export function timedEngineGameStartFields(now: number): {
  mainClockStarted: false;
  firstMoveDeadlineAt: number;
} {
  return {
    mainClockStarted: false,
    firstMoveDeadlineAt: now + FIRST_MOVE_MS,
  };
}

export function firstMoveDeadlineExpired(
  game: Pick<Doc<"games">, "firstMoveDeadlineAt">,
  now: number,
): boolean {
  return game.firstMoveDeadlineAt !== undefined && now > game.firstMoveDeadlineAt;
}

/** When the second player joins a live game. */
export function buildLiveGameActivationPatch(
  game: Pick<Doc<"games">, "playType" | "baseTimeMs">,
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
