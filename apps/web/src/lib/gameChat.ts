import type { Doc } from "../../../../convex/_generated/dataModel";
import type { GameController } from "@/hooks/useGameController";

export type GameChatViewerRole = "player" | "observer";

export function getGameChatViewerRole(
  myColor: "white" | "black" | null,
): GameChatViewerRole {
  return myColor ? "player" : "observer";
}

export function getGameChatGuestName(
  ctrl: Pick<GameController, "isAuthenticated" | "myColor" | "guestSessionId">,
  game: Doc<"games">,
): string | undefined {
  if (ctrl.isAuthenticated) {
    return undefined;
  }
  if (ctrl.myColor === "white") {
    return game.whiteGuestName ?? "Guest";
  }
  if (ctrl.myColor === "black") {
    return game.blackGuestName ?? "Guest";
  }
  return "Spectator";
}

export function getGameChatProps(
  ctrl: Pick<
    GameController,
    "isAuthenticated" | "myColor" | "guestSessionId" | "user"
  >,
  game: Doc<"games">,
) {
  const viewerRole = getGameChatViewerRole(ctrl.myColor);
  return {
    gameId: game._id,
    viewerRole,
    isParticipant: viewerRole === "player",
    guestSessionId: ctrl.isAuthenticated ? undefined : ctrl.guestSessionId,
    guestName: getGameChatGuestName(ctrl, game),
    currentUserId: ctrl.user?._id,
  };
}
