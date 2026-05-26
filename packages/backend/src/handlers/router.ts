import type { ClientMessage } from "../types/api.js";
import type { RequestContext } from "../types/api.js";
import { buildRequestContext } from "../auth/context.js";
import { gamesService, usersService } from "./gamesService.js";
import {
  CHANNELS,
  subscriptionKeyFor,
} from "../realtime/channels.js";
import { subscriptionsRepository } from "../db/repositories/subscriptionsRepository.js";
import { fanOutQueryUpdate } from "../realtime/push.js";
import type { GameId } from "../types/domain.js";

type QueryRunner = (ctx: RequestContext, args: Record<string, unknown>) => Promise<unknown>;
type MutationRunner = (ctx: RequestContext, args: Record<string, unknown>) => Promise<unknown>;

const queries: Record<string, QueryRunner> = {
  [CHANNELS.gamesGet]: (ctx, args) =>
    gamesService.get(ctx, {
      gameId: String(args.gameId) as GameId,
      guestSessionId: args.guestSessionId as string | undefined,
    }),
  [CHANNELS.usersCurrent]: (ctx) => usersService.current(ctx),
};

const mutations: Record<string, MutationRunner> = {
  "games.create": (ctx, args) =>
    gamesService.create(ctx, {
      mode: args.mode as "human_vs_human" | "human_vs_engine",
      engineDifficulty: args.engineDifficulty as number | undefined,
      playType: args.playType as "live" | "correspondence" | undefined,
      baseTimeMs: args.baseTimeMs as number | undefined,
      incrementMs: args.incrementMs as number | undefined,
      daysPerTurn: args.daysPerTurn as number | undefined,
      isPublic: args.isPublic as boolean | undefined,
    }),
  "games.makeMove": (ctx, args) =>
    gamesService.makeMove(ctx, {
      gameId: String(args.gameId) as GameId,
      from: String(args.from),
      to: String(args.to),
      promotion: args.promotion as string | undefined,
      guestSessionId: args.guestSessionId as string | undefined,
    }),
};

export async function runQuery(
  channel: string,
  args: Record<string, unknown>,
  ctx: RequestContext,
): Promise<unknown> {
  const runner = queries[channel];
  if (!runner) {
    throw new Error(`Unknown query channel: ${channel}`);
  }
  return runner(ctx, args);
}

export async function runMutation(
  handler: string,
  args: Record<string, unknown>,
  ctx: RequestContext,
): Promise<unknown> {
  const runner = mutations[handler];
  if (!runner) {
    throw new Error(`Unknown mutation handler: ${handler}`);
  }
  return runner(ctx, args);
}

export async function handleSubscribe(
  connectionId: string,
  channel: string,
  args: Record<string, unknown>,
  ctx: RequestContext,
): Promise<unknown> {
  const subscriptionKey = subscriptionKeyFor(channel, args);
  await subscriptionsRepository.put({
    subscriptionKey,
    connectionId,
    channel,
    argsJson: JSON.stringify(args),
    createdAt: ctx.now,
  });

  const data = await runQuery(channel, args, ctx);
  return data;
}

export async function handleUnsubscribe(
  connectionId: string,
  channel: string,
  args: Record<string, unknown>,
): Promise<void> {
  const subscriptionKey = subscriptionKeyFor(channel, args);
  await subscriptionsRepository.delete(subscriptionKey, connectionId);
}

export function parseClientMessage(body: string): ClientMessage {
  const parsed = JSON.parse(body) as ClientMessage;
  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
    throw new Error("Invalid message");
  }
  return parsed;
}

export async function buildContextFromAuth(
  userId: string | null,
  guestSessionId: string | null,
): Promise<RequestContext> {
  return buildRequestContext(userId, guestSessionId);
}

/** After mutation, push updates to subscribed clients for affected channels. */
export async function pushMutationSideEffects(
  handler: string,
  args: Record<string, unknown>,
  result: unknown,
): Promise<void> {
  if (handler === "games.makeMove" || handler === "games.create") {
    const gameId = (result as { gameId?: GameId })?.gameId ?? (args.gameId as GameId);
    if (gameId) {
      const game = await gamesService.get(
        { userId: null, guestSessionId: null, now: Date.now() },
        { gameId },
      );
      await fanOutQueryUpdate(`game:${gameId}`, CHANNELS.gamesGet, game);
    }
  }
}

export const handlerRegistry = { queries, mutations };
