/** Mirrors packages/backend/src/types/api.ts for the web client. */

export type ClientMessage =
  | { type: "subscribe"; channel: string; args: Record<string, unknown> }
  | { type: "unsubscribe"; channel: string; args: Record<string, unknown> }
  | { type: "invoke"; handler: string; args: Record<string, unknown>; requestId: string };

export type ServerMessage =
  | { type: "subscribed"; channel: string; args: Record<string, unknown>; data: unknown }
  | { type: "update"; channel: string; args: Record<string, unknown>; data: unknown }
  | { type: "invoke_result"; requestId: string; ok: true; data: unknown }
  | { type: "invoke_result"; requestId: string; ok: false; error: string }
  | { type: "error"; message: string };

export type SubscriptionKey = string;

export function subscriptionKey(channel: string, args: Record<string, unknown>): SubscriptionKey {
  return `${channel}:${JSON.stringify(args, Object.keys(args).sort())}`;
}
