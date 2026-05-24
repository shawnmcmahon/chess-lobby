import type { Doc } from "../_generated/dataModel";
import type { Id } from "../_generated/dataModel";

export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isParticipant(
  game: Doc<"games">,
  userId: Id<"users"> | null,
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
  game: Doc<"games">,
  userId: Id<"users"> | null,
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

export type GameChatSenderRole = "player" | "observer";

export function canChatInGame(
  game: Doc<"games">,
  userId: Id<"users"> | null,
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

export function inferMessageSenderRole(
  game: Doc<"games">,
  msg: {
    senderRole?: GameChatSenderRole;
    senderUserId?: Id<"users">;
    senderGuestSessionId?: string;
  },
): GameChatSenderRole {
  if (msg.senderRole) {
    return msg.senderRole;
  }
  if (
    isParticipant(game, msg.senderUserId ?? null, msg.senderGuestSessionId ?? null)
  ) {
    return "player";
  }
  return "observer";
}

export function isLiveSessionGame(game: Doc<"games">): boolean {
  return game.playType !== "correspondence";
}

export function participantSessionKey(
  userId: Id<"users"> | null,
  guestSessionId: string | null,
): string | null {
  if (userId) {
    return `user:${userId}`;
  }
  if (guestSessionId) {
    return `guest:${guestSessionId}`;
  }
  return null;
}

export function listTrackedParticipantKeys(game: Doc<"games">): string[] {
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

export function colorForParticipantKey(
  game: Doc<"games">,
  participantKey: string,
): "white" | "black" | null {
  if (
    participantKey === `user:${game.whiteUserId}` ||
    participantKey === `guest:${game.whiteGuestSessionId}`
  ) {
    return "white";
  }
  if (
    participantKey === `user:${game.blackUserId}` ||
    participantKey === `guest:${game.blackGuestSessionId}`
  ) {
    return "black";
  }
  return null;
}

export const DISCONNECT_GRACE_BUDGET_MS = 90_000;
export const SESSION_PING_GRACE_MS = 20_000;

export function canViewGame(
  game: Doc<"games">,
  userId: Id<"users"> | null,
  guestSessionId: string | null,
): boolean {
  if (game.isPublic !== false) {
    return true;
  }
  return isParticipant(game, userId, guestSessionId);
}

type PlayerColor = "white" | "black";

function disconnectGraceRemainingKey(color: PlayerColor): keyof Doc<"games"> {
  return color === "white"
    ? "whiteDisconnectGraceRemainingMs"
    : "blackDisconnectGraceRemainingMs";
}

function disconnectedAtKey(color: PlayerColor): keyof Doc<"games"> {
  return color === "white" ? "whiteDisconnectedAt" : "blackDisconnectedAt";
}

function disconnectDeadlineAtKey(color: PlayerColor): keyof Doc<"games"> {
  return color === "white"
    ? "whiteDisconnectDeadlineAt"
    : "blackDisconnectDeadlineAt";
}

export function getDisconnectDeadlineAt(
  game: Doc<"games">,
  color: PlayerColor,
): number | undefined {
  return game[disconnectDeadlineAtKey(color)] as number | undefined;
}

export function isPlayerDisconnected(
  game: Doc<"games">,
  color: PlayerColor,
): boolean {
  const deadline = getDisconnectDeadlineAt(game, color);
  return deadline !== undefined;
}

export function hasActiveDisconnectDeadline(
  game: Doc<"games">,
  now: number,
): boolean {
  const whiteDeadline = game.whiteDisconnectDeadlineAt;
  const blackDeadline = game.blackDisconnectDeadlineAt;
  return (
    (whiteDeadline !== undefined && whiteDeadline > now) ||
    (blackDeadline !== undefined && blackDeadline > now)
  );
}

export function buildStartDisconnectPatch(
  game: Doc<"games">,
  color: PlayerColor,
  now: number,
): Record<string, number | undefined> {
  const graceKey = disconnectGraceRemainingKey(color);
  const atKey = disconnectedAtKey(color);
  const deadlineKey = disconnectDeadlineAtKey(color);

  const remaining =
    (game[graceKey] as number | undefined) ?? DISCONNECT_GRACE_BUDGET_MS;
  if (remaining <= 0) {
    return {
      [graceKey]: 0,
      [atKey]: now,
      [deadlineKey]: now,
    };
  }

  return {
    [atKey]: now,
    [deadlineKey]: now + remaining,
  };
}

export function buildClearDisconnectPatch(
  game: Doc<"games">,
  color: PlayerColor,
  now: number,
): Record<string, number | undefined> {
  const graceKey = disconnectGraceRemainingKey(color);
  const atKey = disconnectedAtKey(color);
  const deadlineKey = disconnectDeadlineAtKey(color);

  const disconnectedAt = game[atKey] as number | undefined;
  if (disconnectedAt === undefined) {
    return {};
  }

  const used = now - disconnectedAt;
  const remaining =
    (game[graceKey] as number | undefined) ?? DISCONNECT_GRACE_BUDGET_MS;
  const newRemaining = Math.max(0, remaining - used);

  return {
    [graceKey]: newRemaining,
    [atKey]: undefined,
    [deadlineKey]: undefined,
  };
}

export function isSessionOnline(
  lastSeenAt: number,
  now: number,
): boolean {
  return now - lastSeenAt <= SESSION_PING_GRACE_MS;
}

export function isSpectateEligible(
  game: Doc<"games">,
  sessions: Array<{ participantKey: string; lastSeenAt: number }>,
  now: number,
): boolean {
  if (game.status !== "active" || game.isPublic === false) {
    return false;
  }

  if (
    game.whiteDisconnectDeadlineAt !== undefined ||
    game.blackDisconnectDeadlineAt !== undefined
  ) {
    return false;
  }

  const trackedKeys = listTrackedParticipantKeys(game);
  if (trackedKeys.length === 0) {
    return false;
  }

  const hasLiveSession = trackedKeys.some((key) => {
    const session = sessions.find((entry) => entry.participantKey === key);
    return session !== undefined && isSessionOnline(session.lastSeenAt, now);
  });

  return hasLiveSession;
}
