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
    .index("phone", ["phone"]),

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
  })
    .index("by_inviteToken", ["inviteToken"])
    .index("by_status", ["status"])
    .index("by_whiteUser", ["whiteUserId"])
    .index("by_blackUser", ["blackUserId"]),

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
});
