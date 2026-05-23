import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gameStatus = v.union(
  v.literal("waiting"),
  v.literal("active"),
  v.literal("finished"),
  v.literal("abandoned"),
);

export const gameMode = v.union(
  v.literal("human_vs_human"),
  v.literal("human_vs_engine"),
);

export const playerColor = v.union(v.literal("white"), v.literal("black"));

export const inviteStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("expired"),
);

export const timeControlCategory = v.union(
  v.literal("bullet"),
  v.literal("blitz"),
  v.literal("rapid"),
  v.literal("classical"),
  v.literal("correspondence"),
);

export const playType = v.union(v.literal("live"), v.literal("correspondence"));

const categoryStats = v.object({
  wins: v.number(),
  losses: v.number(),
  draws: v.number(),
});

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    rating: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    profileComplete: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_rating", ["rating"]),

  games: defineTable({
    status: gameStatus,
    mode: gameMode,
    fen: v.string(),
    pgn: v.optional(v.string()),
    currentTurn: playerColor,
    whiteUserId: v.optional(v.id("users")),
    blackUserId: v.optional(v.id("users")),
    whiteGuestName: v.optional(v.string()),
    blackGuestName: v.optional(v.string()),
    whiteGuestSessionId: v.optional(v.string()),
    blackGuestSessionId: v.optional(v.string()),
    inviteToken: v.string(),
    inviteExpiresAt: v.number(),
    engineDifficulty: v.optional(v.number()),
    winner: v.optional(playerColor),
    endReason: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    playType: v.optional(playType),
    timeControlCategory: v.optional(timeControlCategory),
    baseTimeMs: v.optional(v.number()),
    incrementMs: v.optional(v.number()),
    daysPerTurn: v.optional(v.number()),
    whiteTimeMs: v.optional(v.number()),
    blackTimeMs: v.optional(v.number()),
    turnDeadlineAt: v.optional(v.number()),
    lastMoveAt: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    analysisJson: v.optional(v.string()),
  })
    .index("by_inviteToken", ["inviteToken"])
    .index("by_status", ["status"])
    .index("by_whiteUser", ["whiteUserId"])
    .index("by_blackUser", ["blackUserId"])
    .index("by_whiteUser_and_status", ["whiteUserId", "status"])
    .index("by_blackUser_and_status", ["blackUserId", "status"])
    .index("by_status_and_public", ["status", "isPublic"]),

  gameInvites: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    gameId: v.id("games"),
    status: inviteStatus,
    createdAt: v.number(),
  })
    .index("by_toUser_and_status", ["toUserId", "status"])
    .index("by_game", ["gameId"]),

  gameMessages: defineTable({
    gameId: v.id("games"),
    senderUserId: v.optional(v.id("users")),
    senderGuestName: v.optional(v.string()),
    senderGuestSessionId: v.optional(v.string()),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_game", ["gameId"]),

  userStats: defineTable({
    userId: v.id("users"),
    bullet: categoryStats,
    blitz: categoryStats,
    rapid: categoryStats,
    classical: categoryStats,
    correspondence: categoryStats,
    totalWins: v.number(),
    totalLosses: v.number(),
    totalDraws: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_totalWins", ["totalWins"])
    .index("by_totalLosses", ["totalLosses"])
    .index("by_totalDraws", ["totalDraws"]),

  gameSeeks: defineTable({
    userId: v.id("users"),
    timeControlCategory: timeControlCategory,
    baseTimeMs: v.number(),
    incrementMs: v.number(),
    minRating: v.number(),
    maxRating: v.number(),
    createdAt: v.number(),
  }).index("by_category", ["timeControlCategory"]),
});
