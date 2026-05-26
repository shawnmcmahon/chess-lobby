import type { RequestContext } from "../types/api.js";
import type { UserId } from "../types/domain.js";
import { usersRepository } from "../db/repositories/usersRepository.js";

export async function buildRequestContext(
  userId: UserId | null,
  guestSessionId: string | null,
  now = Date.now(),
): Promise<RequestContext> {
  return { userId, guestSessionId, now };
}

export async function getCurrentUser(ctx: RequestContext) {
  if (!ctx.userId) {
    return null;
  }
  return usersRepository.getById(ctx.userId);
}

export function requireUserId(ctx: RequestContext): UserId {
  if (!ctx.userId) {
    throw new Error("Not authenticated");
  }
  return ctx.userId;
}
