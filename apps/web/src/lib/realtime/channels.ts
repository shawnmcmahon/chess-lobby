/** Channel names matching packages/backend/src/realtime/channels.ts */

export const channels = {
  games: {
    get: "games.get",
    listActiveForSpectate: "games.listActiveForSpectate",
    getLobbyCounts: "games.getLobbyCounts",
    listMyActive: "games.listMyActive",
  },
  users: {
    current: "users.current",
    listForLobby: "users.listForLobby",
  },
  chat: {
    list: "chat.list",
  },
  invites: {
    listPendingForMe: "invites.listPendingForMe",
  },
  seeks: {
    listLookingForOpponent: "seeks.listLookingForOpponent",
  },
  presence: {
    listGameObservers: "presence.listGameObservers",
  },
  leaderboard: {
    listTop: "leaderboard.listTop",
  },
  lobbyStats: {
    getPublicStats: "lobbyStats.getPublicStats",
  },
} as const;

export const mutations = {
  games: {
    create: "games.create",
    makeMove: "games.makeMove",
    resign: "games.resign",
    joinByInvite: "games.joinByInvite",
    cancelWaitingGame: "games.cancelWaitingGame",
  },
  chat: {
    send: "chat.send",
  },
  presence: {
    heartbeat: "presence.heartbeat",
    pingSpectatorSession: "presence.pingSpectatorSession",
  },
} as const;
