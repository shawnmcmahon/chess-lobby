import type { ScheduledEvent } from "aws-lambda";
import { gamesRepository } from "../../db/repositories/gamesRepository.js";

/** Port of convex/crons.ts processLiveTimeouts — skeleton for EventBridge trigger. */
export async function handler(_event: ScheduledEvent): Promise<void> {
  const activeGames = await gamesRepository.listByStatus("active");
  const now = Date.now();

  for (const game of activeGames) {
    if (game.playType === "correspondence" || game.baseTimeMs === undefined) {
      continue;
    }
    // TODO: port full timeout resolution from convex/games.ts processLiveTimeouts.
    void now;
    void game;
  }
}
