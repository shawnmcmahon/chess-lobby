/** Domain types mirroring convex/schema.ts — IDs are opaque strings (UUIDs in DynamoDB). */

export type UserId = string;
export type GameId = string;
export type InviteId = string;
export type MessageId = string;

export type GameStatus = "waiting" | "active" | "finished" | "abandoned";
export type GameMode = "human_vs_human" | "human_vs_engine";
export type PlayerColor = "white" | "black";
export type InviteStatus = "pending" | "accepted" | "declined" | "expired";
export type PlayType = "live" | "correspondence";
export type MatchSource = "quick_pair";
export type GameChatSenderRole = "player" | "observer";

export type TimeControlCategory =
  | "bullet"
  | "blitz"
  | "rapid"
  | "classical"
  | "correspondence";

export type CategoryStats = {
  wins: number;
  losses: number;
  draws: number;
};

export type User = {
  userId: UserId;
  email?: string;
  name?: string;
  image?: string;
  displayName?: string;
  bio?: string;
  rating?: number;
  lastSeenAt?: number;
  profileComplete?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Game = {
  gameId: GameId;
  status: GameStatus;
  mode: GameMode;
  fen: string;
  pgn?: string;
  currentTurn: PlayerColor;
  whiteUserId?: UserId;
  blackUserId?: UserId;
  whiteGuestName?: string;
  blackGuestName?: string;
  whiteGuestSessionId?: string;
  blackGuestSessionId?: string;
  inviteToken: string;
  inviteExpiresAt: number;
  engineDifficulty?: number;
  winner?: PlayerColor;
  endReason?: string;
  createdByUserId?: UserId;
  createdAt: number;
  updatedAt: number;
  playType?: PlayType;
  timeControlCategory?: TimeControlCategory;
  baseTimeMs?: number;
  incrementMs?: number;
  daysPerTurn?: number;
  whiteTimeMs?: number;
  blackTimeMs?: number;
  turnDeadlineAt?: number;
  lastMoveAt?: number;
  isPublic?: boolean;
  whiteDisconnectGraceRemainingMs?: number;
  blackDisconnectGraceRemainingMs?: number;
  whiteDisconnectedAt?: number;
  blackDisconnectedAt?: number;
  whiteDisconnectDeadlineAt?: number;
  blackDisconnectDeadlineAt?: number;
  analysisJson?: string;
  matchSource?: MatchSource;
  mainClockStarted?: boolean;
  firstMoveDeadlineAt?: number;
};

export type GameMessage = {
  messageId: MessageId;
  gameId: GameId;
  senderUserId?: UserId;
  senderGuestName?: string;
  senderGuestSessionId?: string;
  senderRole?: GameChatSenderRole;
  body: string;
  createdAt: number;
};

export type GameParticipantSession = {
  sessionId: string;
  gameId: GameId;
  participantKey: string;
  lastSeenAt: number;
};

export type UserStats = {
  userId: UserId;
  bullet: CategoryStats;
  blitz: CategoryStats;
  rapid: CategoryStats;
  classical: CategoryStats;
  correspondence: CategoryStats;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export type ConnectionRecord = {
  connectionId: string;
  userId?: UserId;
  guestSessionId?: string;
  connectedAt: number;
  ttl: number;
};

export type SubscriptionRecord = {
  subscriptionKey: string;
  connectionId: string;
  channel: string;
  argsJson: string;
  createdAt: number;
};
