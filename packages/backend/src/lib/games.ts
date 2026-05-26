import type { Game, GameChatSenderRole, UserId } from "../types/domain.js";

export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isParticipant(
  game: Game,
  userId: UserId | null,
  guestSessionId: string | null,
): boolean {
  if (userId) {
    if (game.whiteUserId === userId || game.blackUserId === userId) {
      return true;
    }
  }
  if (guestSessionId) {
    if (
      game.whiteGuestSessionId === guestSessionId ||
      game.blackGuestSessionId === guestSessionId
    ) {
      return true;
    }
  }
  return false;
}

export function playerColorForUser(
  game: Game,
  userId: UserId | null,
  guestSessionId: string | null,
): "white" | "black" | null {
  if (userId) {
    if (game.whiteUserId === userId) return "white";
    if (game.blackUserId === userId) return "black";
  }
  if (guestSessionId) {
    if (game.whiteGuestSessionId === guestSessionId) return "white";
    if (game.blackGuestSessionId === guestSessionId) return "black";
  }
  return null;
}

export function canChatInGame(
  game: Game,
  userId: UserId | null,
  guestSessionId: string | null,
): GameChatSenderRole | null {
  if (isParticipant(game, userId, guestSessionId)) {
    return "player";
  }
  if (userId || guestSessionId) {
    return "observer";
  }
  return null;
}

export function canViewGame(
  game: Game,
  userId: UserId | null,
  guestSessionId: string | null,
): boolean {
  if (game.isPublic !== false) {
    return true;
  }
  return isParticipant(game, userId, guestSessionId);
}

export const DISCONNECT_GRACE_BUDGET_MS = 90_000;
export const SESSION_PING_GRACE_MS = 20_000;

export function participantSessionKey(
  userId: UserId | null,
  guestSessionId: string | null,
): string | null {
  if (userId) return `user:${userId}`;
  if (guestSessionId) return `guest:${guestSessionId}`;
  return null;
}

export function listTrackedParticipantKeys(game: Game): string[] {
  const keys: string[] = [];
  if (game.whiteUserId) {
    keys.push(`user:${game.whiteUserId}`);
  } else if (game.whiteGuestSessionId) {
    keys.push(`guest:${game.whiteGuestSessionId}`);
  }
  if (game.mode === "human_vs_engine") {
    return keys;
  }
  if (game.blackUserId) {
    keys.push(`user:${game.blackUserId}`);
  } else if (game.blackGuestSessionId) {
    keys.push(`guest:${game.blackGuestSessionId}`);
  }
  return keys;
}

export function isLiveSessionGame(game: Game): boolean {
  return game.playType !== "correspondence";
}

export function isSessionOnline(lastSeenAt: number, now: number): boolean {
  return now - lastSeenAt <= SESSION_PING_GRACE_MS;
}
