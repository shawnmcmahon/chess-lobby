import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Game, GameId } from "../types/domain.js";
import { getDocClient, newId } from "./client.js";
import { GAME_INDEXES, TABLES } from "./tables.js";

export class GamesRepository {
  async getById(gameId: GameId): Promise<Game | null> {
    const result = await getDocClient().send(
      new GetCommand({
        TableName: TABLES.games,
        Key: { gameId },
      }),
    );
    return (result.Item as Game | undefined) ?? null;
  }

  async getByInviteToken(inviteToken: string): Promise<Game | null> {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLES.games,
        IndexName: GAME_INDEXES.byInviteToken,
        KeyConditionExpression: "inviteToken = :token",
        ExpressionAttributeValues: { ":token": inviteToken },
        Limit: 1,
      }),
    );
    return (result.Items?.[0] as Game | undefined) ?? null;
  }

  async insert(game: Omit<Game, "gameId">): Promise<GameId> {
    const gameId = newId();
    const item: Game = { ...game, gameId };
    await getDocClient().send(
      new PutCommand({
        TableName: TABLES.games,
        Item: item,
        ConditionExpression: "attribute_not_exists(gameId)",
      }),
    );
    return gameId;
  }

  async patch(gameId: GameId, updates: Partial<Game>): Promise<void> {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;

    const setParts: string[] = [];
    const removeParts: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of entries) {
      const nameKey = `#${key}`;
      names[nameKey] = key;
      if (value === undefined) {
        removeParts.push(nameKey);
      } else {
        const valueKey = `:${key}`;
        setParts.push(`${nameKey} = ${valueKey}`);
        values[valueKey] = value;
      }
    }

    const parts: string[] = [];
    if (setParts.length > 0) {
      parts.push(`SET ${setParts.join(", ")}`);
    }
    if (removeParts.length > 0) {
      parts.push(`REMOVE ${removeParts.join(", ")}`);
    }

    await getDocClient().send(
      new UpdateCommand({
        TableName: TABLES.games,
        Key: { gameId },
        UpdateExpression: parts.join(" "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: Object.keys(values).length > 0 ? values : undefined,
      }),
    );
  }

  async listByStatus(status: Game["status"]): Promise<Game[]> {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLES.games,
        IndexName: GAME_INDEXES.byStatus,
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    );
    return (result.Items as Game[] | undefined) ?? [];
  }
}

export const gamesRepository = new GamesRepository();
