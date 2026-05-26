import {
  BatchWriteCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { SubscriptionRecord } from "../../types/domain.js";
import { getDocClient } from "../client.js";
import { TABLES } from "../tables.js";

export class SubscriptionsRepository {
  async put(record: SubscriptionRecord): Promise<void> {
    await getDocClient().send(
      new PutCommand({
        TableName: TABLES.subscriptions,
        Item: record,
      }),
    );
  }

  async listByKey(subscriptionKey: string): Promise<SubscriptionRecord[]> {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLES.subscriptions,
        KeyConditionExpression: "subscriptionKey = :key",
        ExpressionAttributeValues: { ":key": subscriptionKey },
      }),
    );
    return (result.Items as SubscriptionRecord[] | undefined) ?? [];
  }

  async listByConnection(connectionId: string): Promise<SubscriptionRecord[]> {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLES.subscriptions,
        IndexName: "by_connectionId",
        KeyConditionExpression: "connectionId = :id",
        ExpressionAttributeValues: { ":id": connectionId },
      }),
    );
    return (result.Items as SubscriptionRecord[] | undefined) ?? [];
  }

  async deleteAllForConnection(connectionId: string): Promise<void> {
    const subs = await this.listByConnection(connectionId);
    if (subs.length === 0) return;

    const batches = [];
    for (let i = 0; i < subs.length; i += 25) {
      batches.push(subs.slice(i, i + 25));
    }

    for (const batch of batches) {
      await getDocClient().send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLES.subscriptions]: batch.map((sub) => ({
              DeleteRequest: {
                Key: {
                  subscriptionKey: sub.subscriptionKey,
                  connectionId: sub.connectionId,
                },
              },
            })),
          },
        }),
      );
    }
  }
}

export const subscriptionsRepository = new SubscriptionsRepository();
