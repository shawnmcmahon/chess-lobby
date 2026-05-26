import type { GameId, UserId } from "../types/domain.js";

/** Maps Convex query channels to DynamoDB subscription keys for fan-out. */
export const CHANNELS = {
  gamesGet: "games.get",
  gamesListActiveForSpectate: "games.listActiveForSpectate",
  gamesGetLobbyCounts: "games.getLobbyCounts",
  gamesListMyActive: "games.listMyActive",
  chatList: "chat.list",
  usersCurrent: "users.current",
  usersListForLobby: "users.listForLobby",
  invitesListPendingForMe: "invites.listPendingForMe",
  seeksListLookingForOpponent: "seeks.listLookingForOpponent",
  presenceListGameObservers: "presence.listGameObservers",
  leaderboardListTop: "leaderboard.listTop",
  lobbyStatsGetPublicStats: "lobbyStats.getPublicStats",
} as const;

export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

export function subscriptionKeyFor(channel: string, args: Record<string, unknown>): string {
  switch (channel) {
    case CHANNELS.gamesGet:
      return `game:${String(args.gameId)}`;
    case CHANNELS.chatList:
      return `game:${String(args.gameId)}:chat`;
    case CHANNELS.presenceListGameObservers:
      return `game:${String(args.gameId)}:observers`;
    case CHANNELS.usersCurrent:
      return `user:${String(args.userId ?? "self")}:current`;
    case CHANNELS.invitesListPendingForMe:
      return `user:${String(args.userId)}:invites`;
    case CHANNELS.gamesListMyActive:
      return `user:${String(args.userId)}:active-games`;
    case CHANNELS.gamesListActiveForSpectate:
      return "lobby:spectate";
    case CHANNELS.gamesGetLobbyCounts:
      return "lobby:counts";
    case CHANNELS.usersListForLobby:
      return "lobby:online";
    case CHANNELS.seeksListLookingForOpponent:
      return "lobby:seeks";
    case CHANNELS.leaderboardListTop:
      return `leaderboard:${String(args.sortBy ?? "rating")}`;
    case CHANNELS.lobbyStatsGetPublicStats:
      return "lobby:stats";
    default:
      return `channel:${channel}:${stableArgsHash(args)}`;
  }
}

/** Keys invalidated when a game row changes. */
export function subscriptionKeysForGameChange(gameId: GameId): string[] {
  return [
    `game:${gameId}`,
    `game:${gameId}:chat`,
    `game:${gameId}:observers`,
    "lobby:spectate",
    "lobby:counts",
    "lobby:stats",
  ];
}

export function subscriptionKeysForUserChange(userId: UserId): string[] {
  return [
    `user:${userId}:current`,
    `user:${userId}:invites`,
    `user:${userId}:active-games`,
    "lobby:online",
  ];
}

function stableArgsHash(args: Record<string, unknown>): string {
  return JSON.stringify(args, Object.keys(args).sort());
}

export function parseArgsJson(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}
