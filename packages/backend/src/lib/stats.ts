import type { Game, UserId } from "../types/domain.js";
import type { TimeControlCategory } from "./timeControl.js";

export type CategoryStats = {
  wins: number;
  losses: number;
  draws: number;
};

export const EMPTY_CATEGORY_STATS: CategoryStats = {
  wins: 0,
  losses: 0,
  draws: 0,
};

export type UserStatsDoc = {
  userId: UserId;
  bullet: CategoryStats;
  blitz: CategoryStats;
  rapid: CategoryStats;
  classical: CategoryStats;
  correspondence: CategoryStats;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export function createEmptyUserStats(userId: UserId): UserStatsDoc {
  return {
    userId,
    bullet: { ...EMPTY_CATEGORY_STATS },
    blitz: { ...EMPTY_CATEGORY_STATS },
    rapid: { ...EMPTY_CATEGORY_STATS },
    classical: { ...EMPTY_CATEGORY_STATS },
    correspondence: { ...EMPTY_CATEGORY_STATS },
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
  };
}

function categoryField(
  category: TimeControlCategory,
): keyof Pick<
  UserStatsDoc,
  "bullet" | "blitz" | "rapid" | "classical" | "correspondence"
> {
  return category;
}

type GameOutcome = "win" | "loss" | "draw";

function outcomeForColor(
  winner: "white" | "black" | undefined,
  color: "white" | "black",
): GameOutcome {
  if (!winner) return "draw";
  return winner === color ? "win" : "loss";
}

function applyOutcome(stats: CategoryStats, outcome: GameOutcome): CategoryStats {
  if (outcome === "win") {
    return { ...stats, wins: stats.wins + 1 };
  }
  if (outcome === "loss") {
    return { ...stats, losses: stats.losses + 1 };
  }
  return { ...stats, draws: stats.draws + 1 };
}

/** Pure stats computation — persistence handled by UserStatsRepository. */
export function computeStatsUpdate(
  stats: UserStatsDoc,
  game: Game,
  color: "white" | "black",
): UserStatsDoc {
  const category = game.timeControlCategory ?? "rapid";
  const field = categoryField(category);
  const outcome = outcomeForColor(game.winner, color);
  const categoryStats = applyOutcome(stats[field], outcome);

  return {
    ...stats,
    [field]: categoryStats,
    totalWins: stats.totalWins + (outcome === "win" ? 1 : 0),
    totalLosses: stats.totalLosses + (outcome === "loss" ? 1 : 0),
    totalDraws: stats.totalDraws + (outcome === "draw" ? 1 : 0),
  };
}

export function playersInGame(
  game: Game,
): Array<{ userId: UserId; color: "white" | "black" }> {
  const players: Array<{ userId: UserId; color: "white" | "black" }> = [];
  if (game.whiteUserId) {
    players.push({ userId: game.whiteUserId, color: "white" });
  }
  if (game.blackUserId) {
    players.push({ userId: game.blackUserId, color: "black" });
  }
  return players;
}
