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
