/** DynamoDB table names — overridden via env at deploy time. */
export const TABLES = {
  users: process.env.USERS_TABLE ?? "chess-lobby-users",
  games: process.env.GAMES_TABLE ?? "chess-lobby-games",
  gameMessages: process.env.GAME_MESSAGES_TABLE ?? "chess-lobby-game-messages",
  gameInvites: process.env.GAME_INVITES_TABLE ?? "chess-lobby-game-invites",
  gameParticipantSessions:
    process.env.GAME_PARTICIPANT_SESSIONS_TABLE ??
    "chess-lobby-game-participant-sessions",
  userStats: process.env.USER_STATS_TABLE ?? "chess-lobby-user-stats",
  connections: process.env.CONNECTIONS_TABLE ?? "chess-lobby-connections",
  subscriptions: process.env.SUBSCRIPTIONS_TABLE ?? "chess-lobby-subscriptions",
} as const;

/** GSI names on the games table. */
export const GAME_INDEXES = {
  byInviteToken: "by_inviteToken",
  byStatus: "by_status",
  byWhiteUser: "by_whiteUser",
  byBlackUser: "by_blackUser",
  byWhiteUserAndStatus: "by_whiteUser_and_status",
  byBlackUserAndStatus: "by_blackUser_and_status",
  byStatusAndPublic: "by_status_and_public",
  byStatusAndMatchSource: "by_status_and_matchSource",
} as const;
