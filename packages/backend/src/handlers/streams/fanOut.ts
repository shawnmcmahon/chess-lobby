import type { DynamoDBStreamEvent } from "aws-lambda";
import {
  subscriptionKeysForGameChange,
  subscriptionKeysForUserChange,
  CHANNELS,
} from "../../realtime/channels.js";
import { fanOutQueryUpdate } from "../../realtime/push.js";
import { gamesRepository } from "../../db/repositories/gamesRepository.js";

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  for (const record of event.Records) {
    if (!record.dynamodb?.NewImage && !record.dynamodb?.OldImage) {
      continue;
    }

    const tableName = record.eventSourceARN?.split("/")[1] ?? "";

    if (tableName.includes("games")) {
      const gameId =
        record.dynamodb.NewImage?.gameId?.S ??
        record.dynamodb.OldImage?.gameId?.S;
      if (!gameId) continue;

      const game = await gamesRepository.getById(gameId);
      for (const key of subscriptionKeysForGameChange(gameId)) {
        if (key.startsWith("game:") && key.endsWith(":chat")) continue;
        await fanOutQueryUpdate(key, CHANNELS.gamesGet, game);
      }
    }

    if (tableName.includes("users")) {
      const userId =
        record.dynamodb.NewImage?.userId?.S ??
        record.dynamodb.OldImage?.userId?.S;
      if (!userId) continue;

      for (const key of subscriptionKeysForUserChange(userId)) {
        await fanOutQueryUpdate(key, CHANNELS.usersCurrent, { userId });
      }
    }
  }
}
