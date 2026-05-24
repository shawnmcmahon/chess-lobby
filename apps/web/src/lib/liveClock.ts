export const FIRST_MOVE_MS = 30_000;

type ClockGame = {
  status: string;
  playType?: "live" | "correspondence";
  baseTimeMs?: number;
  mainClockStarted?: boolean;
  firstMoveDeadlineAt?: number;
  whiteTimeMs?: number;
  blackTimeMs?: number;
  currentTurn: "white" | "black";
  lastMoveAt?: number;
};

export function isInFirstMovePhase(game: ClockGame): boolean {
  return (
    game.playType !== "correspondence" &&
    game.baseTimeMs !== undefined &&
    game.mainClockStarted === false
  );
}

export function getLiveClockDisplay(game: ClockGame, now: number) {
  const whiteBank = game.whiteTimeMs ?? game.baseTimeMs ?? 0;
  const blackBank = game.blackTimeMs ?? game.baseTimeMs ?? 0;

  if (
    game.status !== "active" ||
    game.playType === "correspondence" ||
    game.baseTimeMs === undefined
  ) {
    return {
      displayWhite: whiteBank,
      displayBlack: blackBank,
      inFirstMovePhase: false,
      lowWhite: false,
      lowBlack: false,
    };
  }

  if (isInFirstMovePhase(game)) {
    const remaining = Math.max(0, (game.firstMoveDeadlineAt ?? now) - now);
    const displayWhite =
      game.currentTurn === "white" ? remaining : whiteBank;
    const displayBlack =
      game.currentTurn === "black" ? remaining : blackBank;

    return {
      displayWhite,
      displayBlack,
      inFirstMovePhase: true,
      lowWhite: game.currentTurn === "white" && remaining < 10_000,
      lowBlack: game.currentTurn === "black" && remaining < 10_000,
    };
  }

  const elapsed = game.lastMoveAt ? now - game.lastMoveAt : 0;
  const displayWhite =
    game.currentTurn === "white" ? whiteBank - elapsed : whiteBank;
  const displayBlack =
    game.currentTurn === "black" ? blackBank - elapsed : blackBank;

  return {
    displayWhite,
    displayBlack,
    inFirstMovePhase: false,
    lowWhite: displayWhite < 30_000,
    lowBlack: displayBlack < 30_000,
  };
}
