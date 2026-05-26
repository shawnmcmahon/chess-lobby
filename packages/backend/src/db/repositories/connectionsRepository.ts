import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ConnectionRecord } from "../../types/domain.js";
import { getDocClient } from "../client.js";
import { TABLES } from "../tables.js";

export class ConnectionsRepository {
  async put(record: ConnectionRecord): Promise<void> {
    await getDocClient().send(
      new PutCommand({
        TableName: TABLES.connections,
        Item: record,
      }),
    );
  }

  async get(connectionId: string): Promise<ConnectionRecord | null> {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLES.connections,
        KeyConditionExpression: "connectionId = :id",
        ExpressionAttributeValues: { ":id": connectionId },
        Limit: 1,
      }),
    );
    return (result.Items?.[0] as ConnectionRecord | undefined) ?? null;
  }

  async delete(connectionId: string): Promise<void> {
    await getDocClient().send(
      new DeleteCommand({
        TableName: TABLES.connections,
        Key: { connectionId },
      }),
    );
  }
}

export const connectionsRepository = new ConnectionsRepository();
