import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { connectionsRepository } from "../../db/repositories/connectionsRepository.js";
import { subscriptionsRepository } from "../../db/repositories/subscriptionsRepository.js";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    return { statusCode: 500, body: "Missing connectionId" };
  }

  await subscriptionsRepository.deleteAllForConnection(connectionId);
  await connectionsRepository.delete(connectionId);

  return { statusCode: 200, body: "Disconnected" };
}
