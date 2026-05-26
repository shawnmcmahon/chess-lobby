import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { connectionsRepository } from "../../db/repositories/connectionsRepository.js";
import {
  buildContextFromAuth,
  handleSubscribe,
  handleUnsubscribe,
  parseClientMessage,
  pushMutationSideEffects,
  runMutation,
} from "../router.js";
import { pushToConnection } from "../../realtime/push.js";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId || !event.body) {
    return { statusCode: 400, body: "Bad request" };
  }

  const connection = await connectionsRepository.get(connectionId);
  const ctx = await buildContextFromAuth(
    connection?.userId ?? null,
    connection?.guestSessionId ?? null,
  );

  try {
    const message = parseClientMessage(event.body);

    if (message.type === "subscribe") {
      const data = await handleSubscribe(
        connectionId,
        message.channel,
        message.args,
        ctx,
      );
      await pushToConnection(connectionId, {
        type: "subscribed",
        channel: message.channel,
        args: message.args,
        data,
      });
      return { statusCode: 200, body: "Subscribed" };
    }

    if (message.type === "unsubscribe") {
      await handleUnsubscribe(connectionId, message.channel, message.args);
      return { statusCode: 200, body: "Unsubscribed" };
    }

    if (message.type === "invoke") {
      const result = await runMutation(message.handler, message.args, ctx);
      await pushMutationSideEffects(message.handler, message.args, result);
      await pushToConnection(connectionId, {
        type: "invoke_result",
        requestId: message.requestId,
        ok: true,
        data: result,
      });
      return { statusCode: 200, body: "Invoked" };
    }

    return { statusCode: 400, body: "Unknown message type" };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await pushToConnection(connectionId, { type: "error", message: errMsg });
    return { statusCode: 500, body: errMsg };
  }
}
