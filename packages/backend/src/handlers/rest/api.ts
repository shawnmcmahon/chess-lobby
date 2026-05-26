import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { extractBearerToken, verifyAccessToken } from "../../auth/cognito.js";
import { buildRequestContext } from "../../auth/context.js";
import { runQuery } from "./router.js";

/** REST fallback for one-shot reads and pagination cursors. */
export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const token = extractBearerToken(event.headers?.authorization);
  const claims = token ? await verifyAccessToken(token) : null;
  const ctx = await buildRequestContext(claims?.userId ?? null, null);

  const path = event.rawPath ?? "";
  const channel = event.queryStringParameters?.channel;
  const argsJson = event.queryStringParameters?.args ?? "{}";

  if (path === "/health") {
    return json(200, { ok: true });
  }

  if (path === "/query" && channel) {
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>;
      const data = await runQuery(channel, args, ctx);
      return json(200, { data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Query failed";
      return json(400, { error: message });
    }
  }

  return json(404, { error: "Not found" });
}

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
