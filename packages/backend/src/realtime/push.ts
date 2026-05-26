import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { ServerMessage } from "../types/api.js";
import { subscriptionsRepository } from "../db/repositories/subscriptionsRepository.js";
import { connectionsRepository } from "../db/repositories/connectionsRepository.js";
import { parseArgsJson } from "./channels.js";

let managementClient: ApiGatewayManagementApiClient | undefined;

function getManagementClient(): ApiGatewayManagementApiClient {
  if (!managementClient) {
    const endpoint = process.env.WEBSOCKET_API_ENDPOINT;
    if (!endpoint) {
      throw new Error("WEBSOCKET_API_ENDPOINT is not configured");
    }
    managementClient = new ApiGatewayManagementApiClient({ endpoint });
  }
  return managementClient;
}

export async function pushToConnection(
  connectionId: string,
  message: ServerMessage,
): Promise<boolean> {
  try {
    await getManagementClient().send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(message)),
      }),
    );
    return true;
  } catch (error) {
    if (error instanceof GoneException) {
      await connectionsRepository.delete(connectionId);
      await subscriptionsRepository.deleteAllForConnection(connectionId);
      return false;
    }
    throw error;
  }
}

export async function fanOutToSubscriptionKey(
  subscriptionKey: string,
  message: ServerMessage,
): Promise<void> {
  const subs = await subscriptionsRepository.listByKey(subscriptionKey);
  await Promise.all(subs.map((sub) => pushToConnection(sub.connectionId, message)));
}

export async function fanOutQueryUpdate(
  subscriptionKey: string,
  channel: string,
  data: unknown,
): Promise<void> {
  const subs = await subscriptionsRepository.listByKey(subscriptionKey);
  await Promise.all(
    subs.map((sub) =>
      pushToConnection(sub.connectionId, {
        type: "update",
        channel,
        args: parseArgsJson(sub.argsJson),
        data,
      }),
    ),
  );
}
