import type { Game, GameId, User, UserId } from "./domain.js";

/** Wire protocol between WebSocket client and Lambda handlers. */

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

export type RequestContext = {
  userId: UserId | null;
  guestSessionId: string | null;
  now: number;
};

export type GamesGetArgs = { gameId: GameId; guestSessionId?: string };
export type GamesMakeMoveArgs = {
  gameId: GameId;
  from: string;
  to: string;
  promotion?: string;
  guestSessionId?: string;
};

export type GamesGetResult = Game | null;
export type UsersCurrentResult = User | null;
