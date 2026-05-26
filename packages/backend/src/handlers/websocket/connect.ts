import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { verifyAccessToken } from "../../auth/cognito.js";
import { connectionsRepository } from "../../db/repositories/connectionsRepository.js";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    return { statusCode: 500, body: "Missing connectionId" };
  }

  const token =
    event.queryStringParameters?.token ??
    event.headers?.authorization?.replace(/^Bearer\s+/i, "");
  const guestSessionId = event.queryStringParameters?.guestSessionId ?? undefined;

  let userId: string | undefined;
  if (token) {
    const claims = await verifyAccessToken(token);
    userId = claims?.userId;
  }

  const now = Date.now();
  await connectionsRepository.put({
    connectionId,
    userId,
    guestSessionId,
    connectedAt: now,
    ttl: Math.floor(now / 1000) + 60 * 60 * 24,
  });

  return { statusCode: 200, body: "Connected" };
}
