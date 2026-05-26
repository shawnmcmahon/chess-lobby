# Convex → AWS Migration Status

Branch: **`feature/aws-backend-rewrite`**  
Last updated: May 2026  
**This is not a completed migration.** Production still runs on Convex (`main.tsx` + `convex/`).

Use this doc to see exactly what exists on the rewrite branch vs what remains.

---

## Overall progress

| Area | Done | Total | Notes |
|------|------|-------|-------|
| Public queries | 2 | 22 | `games.get`, `users.current` |
| Public mutations | 2 | 22 | `games.create`, `games.makeMove` |
| Internal jobs | 1 skeleton | 9 | Live timeout cron stub only |
| Shared lib (pure logic) | 5 | 6 | Missing `computerEngine.ts` port |
| DynamoDB repositories | 4 | 10+ | Missing invites, messages, sessions, stats, presence |
| Lambda handlers | 7 stubs | 7+ | Core WS path sketched; not production-ready |
| Frontend realtime SDK | 1 | 1 | `apps/web/src/lib/realtime/` |
| Frontend component migration | 1 example | ~47 files | Only `useGameController.aws.ts` |
| Auth | JWT verify stub | full stack | Cognito backend stub; no Amplify frontend |
| Data migration | 0 | 1 | No export/import scripts |
| Deploy / cutover | 0 | 1 | SAM template reference only |

**Rough completion: ~15%** (architecture spike + core game path skeleton)

---

## Convex file → AWS counterpart

### Schema & config

| Convex file | AWS target | Status |
|-------------|------------|--------|
| [`convex/schema.ts`](../convex/schema.ts) | [`packages/backend/src/types/domain.ts`](../packages/backend/src/types/domain.ts) + [`infra/backend/template.yaml`](../infra/backend/template.yaml) | **Partial** — types ported; not all tables in SAM template |
| [`convex/convex.config.ts`](../convex/convex.config.ts) (presence component) | Custom presence in DynamoDB + `lobby:online` channel | **Not started** |
| [`convex/_generated/*`](../convex/_generated/) | Hand-written types in `packages/backend/src/types/` | **Partial** — no codegen equivalent |

### Shared libraries (`convex/lib/`)

| Convex file | AWS file | Status |
|-------------|----------|--------|
| [`convex/lib/chess.ts`](../convex/lib/chess.ts) | [`packages/backend/src/lib/chess.ts`](../packages/backend/src/lib/chess.ts) | **Done** |
| [`convex/lib/games.ts`](../convex/lib/games.ts) | [`packages/backend/src/lib/games.ts`](../packages/backend/src/lib/games.ts) | **Partial** — core helpers only; disconnect/spectate helpers trimmed |
| [`convex/lib/liveClock.ts`](../convex/lib/liveClock.ts) | [`packages/backend/src/lib/liveClock.ts`](../packages/backend/src/lib/liveClock.ts) | **Done** |
| [`convex/lib/timeControl.ts`](../convex/lib/timeControl.ts) | [`packages/backend/src/lib/timeControl.ts`](../packages/backend/src/lib/timeControl.ts) | **Partial** — presets omitted (frontend-only today) |
| [`convex/lib/stats.ts`](../convex/lib/stats.ts) | [`packages/backend/src/lib/stats.ts`](../packages/backend/src/lib/stats.ts) | **Partial** — pure compute only; no DB persistence |
| [`convex/lib/computerEngine.ts`](../convex/lib/computerEngine.ts) | `packages/backend/src/lib/computerEngine.ts` | **Not started** |
| [`convex/lib/auth.ts`](../convex/lib/auth.ts) | [`packages/backend/src/auth/context.ts`](../packages/backend/src/auth/context.ts) | **Partial** — no Convex session model |

### Auth

| Convex file | AWS target | Status |
|-------------|------------|--------|
| [`convex/auth.ts`](../convex/auth.ts) | Cognito User Pool + [`packages/backend/src/auth/cognito.ts`](../packages/backend/src/auth/cognito.ts) | **Stub** — JWT verify only |
| [`convex/auth.config.ts`](../convex/auth.config.ts) | Cognito app client + Google IdP | **Not started** |
| [`convex/authPassword.ts`](../convex/authPassword.ts) | Cognito password + CustomMessage Lambda | **Not started** |
| [`convex/ResendOTP.ts`](../convex/ResendOTP.ts) | Cognito CustomMessage → Resend/SES | **Not started** |
| [`convex/ResendOTPPasswordReset.ts`](../convex/ResendOTPPasswordReset.ts) | Cognito forgot-password flow | **Not started** |
| [`convex/http.ts`](../convex/http.ts) | Cognito Hosted UI / Amplify | **Not started** |
| `@convex-dev/auth` (frontend) | [`apps/web/src/lib/realtime/auth.ts`](../apps/web/src/lib/realtime/auth.ts) + Amplify | **Stub** — placeholder session |

### Games (`convex/games.ts`)

| Convex export | AWS location | Status |
|---------------|--------------|--------|
| `get` | [`gamesService.gamesGet`](../packages/backend/src/services/gamesService.ts) + router | **Done** |
| `create` | [`gamesService.gamesCreate`](../packages/backend/src/services/gamesService.ts) | **Done** |
| `makeMove` | [`gamesService.gamesMakeMove`](../packages/backend/src/services/gamesService.ts) | **Done** (engine schedule TODO) |
| `getForReview` | `gamesService` | **Not started** |
| `getByInviteToken` | `gamesRepository.getByInviteToken` exists; no service/handler | **Partial** |
| `joinByInvite` | `gamesService` | **Not started** |
| `resign` | `gamesService` | **Not started** |
| `cancelWaitingGame` | `gamesService` | **Not started** |
| `saveAnalysis` | `gamesService` | **Not started** |
| `listMyActive` | `gamesService` + channel `user:{id}:active-games` | **Not started** |
| `listMyFinished` | `gamesService` + REST pagination | **Not started** |
| `listActiveForSpectate` | `gamesService` + channel `lobby:spectate` | **Not started** |
| `getLobbyCounts` | `gamesService` + channel `lobby:counts` | **Not started** |
| `listFinishedForUser` | `gamesService` + REST pagination | **Not started** |
| `pingParticipantSession` | `sessionsService` | **Not started** |
| `leaveParticipantSession` | `sessionsService` + SQS 5s delay | **Not started** |
| `getInternal` | `gamesRepository.getById` (internal) | **Partial** |
| `applyEngineMoveInternal` | `engineService` + SQS | **Not started** |
| `setEngineError` | `engineService` | **Not started** |
| `applySessionDisconnect` | `sessionsService` + SQS | **Not started** |
| `processLiveTimeouts` | [`handlers/crons/processLiveTimeouts.ts`](../packages/backend/src/handlers/crons/processLiveTimeouts.ts) | **Skeleton only** |
| `processCorrespondenceTimeouts` | `handlers/crons/processCorrespondenceTimeouts.ts` | **Not started** |
| `processInactiveGameSessions` | `handlers/crons/processInactiveGameSessions.ts` | **Not started** |
| `processExpiredWaitingGames` | `handlers/crons/processExpiredWaitingGames.ts` | **Not started** |

### Users (`convex/users.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `current` | [`usersService.current`](../packages/backend/src/services/gamesService.ts) | **Done** |
| `syncProfile` | Cognito post-auth trigger + `usersRepository` | **Not started** |
| `getById` | `usersService` | **Not started** |
| `getPublicProfile` | `usersService` | **Not started** |
| `getStats` | `userStatsRepository` | **Not started** |
| `updateProfile` | `usersService` | **Not started** |
| `listForLobby` | `presenceService` + channel `lobby:online` | **Not started** |

### Invites (`convex/invites.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `send` | `invitesService` + `gameInvites` table | **Not started** |
| `listPendingForMe` | `invitesService` + channel `user:{id}:invites` | **Not started** |
| `accept` | `invitesService` | **Not started** |
| `decline` | `invitesService` | **Not started** |

### Seeks / quick pair (`convex/seeks.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `createQuickPair` | `seeksService` (TransactWrite matchmaking) | **Not started** |
| `joinQuickPairGame` | `seeksService` | **Not started** |
| `listLookingForOpponent` | `seeksService` + channel `lobby:seeks` | **Not started** |
| `cancelQuickPair` | `seeksService` | **Not started** |

### Chat (`convex/chat.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `list` | `chatService` + channel `game:{id}:chat` | **Not started** |
| `send` | `chatService` | **Not started** |

### Presence (`convex/presence.ts` + `@convex-dev/presence`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `heartbeat` | `presenceService` + DynamoDB TTL | **Not started** |
| `list` | `@convex-dev/presence` replacement | **Not started** |
| `disconnect` | `presenceService` | **Not started** |
| `getUserId` | Cognito JWT on client | **Not started** |
| `pingSpectatorSession` | `spectatorSessionsRepository` | **Not started** |
| `leaveSpectatorSession` | `spectatorSessionsRepository` | **Not started** |
| `listGameObservers` | channel `game:{id}:observers` | **Not started** |

### Leaderboard & lobby stats

| Convex file | AWS target | Status |
|-------------|------------|--------|
| [`convex/leaderboard.ts`](../convex/leaderboard.ts) `listTop` | `leaderboardService` + GSI or cache item | **Not started** |
| [`convex/lobbyStats.ts`](../convex/lobbyStats.ts) `getPublicStats` | `lobbyStatsService` + channel `lobby:stats` | **Not started** |

### Engine (`convex/engine.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `makeEngineMove` (internal action) | Lambda + SQS + Lightsail `ENGINE_API_URL` | **Not started** |

### Crons (`convex/crons.ts`)

| Cron | AWS target | Status |
|------|------------|--------|
| Live clock timeouts (1 min) | EventBridge → [`processLiveTimeouts`](../packages/backend/src/handlers/crons/processLiveTimeouts.ts) | **Skeleton** |
| Correspondence timeouts (1 hr) | EventBridge → `processCorrespondenceTimeouts` | **Not started** |
| Inactive game sessions (30 sec) | EventBridge → `processInactiveGameSessions` | **Not started** |
| Expired waiting games (5 min) | EventBridge → `processExpiredWaitingGames` | **Not started** |

### Migrations (`convex/migrations.ts`)

| Convex export | AWS target | Status |
|---------------|------------|--------|
| `cleanupStuckEngineGames` | One-off Lambda or script | **Not started** |
| `backfillSchemaAndStats` | DynamoDB migration script | **Not started** |

---

## DynamoDB tables

| Convex table | SAM / `tables.ts` | Repository | Status |
|--------------|-------------------|------------|--------|
| `users` | Yes | `usersRepository` | **Partial** |
| `games` | Yes | `gamesRepository` | **Partial** |
| `gameMessages` | Env constant only | — | **Not started** |
| `gameInvites` | Env constant only | — | **Not started** |
| `gameParticipantSessions` | Env constant only | — | **Not started** |
| `gameSpectatorSessions` | — | — | **Not started** |
| `userStats` | Env constant only | — | **Not started** |
| auth tables (`authAccounts`, etc.) | Cognito (no DynamoDB) | — | **Not started** |
| presence component tables | Custom `presence` table | — | **Not started** |
| `connections` (new) | Yes | `connectionsRepository` | **Done** |
| `subscriptions` (new) | Yes | `subscriptionsRepository` | **Done** |

---

## Realtime plumbing

| Piece | AWS file | Status |
|-------|----------|--------|
| Channel name constants | [`packages/backend/src/realtime/channels.ts`](../packages/backend/src/realtime/channels.ts) | **Done** — all 22 query channels mapped |
| Subscription registry | `subscriptionsRepository` | **Done** |
| WebSocket `$connect` | [`handlers/websocket/connect.ts`](../packages/backend/src/handlers/websocket/connect.ts) | **Done** — stub |
| WebSocket `$disconnect` | [`handlers/websocket/disconnect.ts`](../packages/backend/src/handlers/websocket/disconnect.ts) | **Done** — stub |
| WebSocket `$default` (subscribe/invoke) | [`handlers/websocket/message.ts`](../packages/backend/src/handlers/websocket/message.ts) | **Done** — stub |
| Mutation router | [`handlers/router.ts`](../packages/backend/src/handlers/router.ts) | **Partial** — 2 queries, 2 mutations wired |
| DynamoDB Streams fan-out | [`handlers/streams/fanOut.ts`](../packages/backend/src/handlers/streams/fanOut.ts) | **Partial** |
| REST query fallback | [`handlers/rest/api.ts`](../packages/backend/src/handlers/rest/api.ts) | **Stub** |
| Frontend client | [`apps/web/src/lib/realtime/`](../apps/web/src/lib/realtime/) | **Done** — SDK skeleton |

---

## Frontend files using Convex

**Still on Convex (production entry: [`main.tsx`](../apps/web/src/main.tsx))**

~47 files import `convex/react` or `convex/_generated`. Each needs:

1. Replace `useQuery(api.X.Y, args)` → `useQuery(channels.X.Y, args)`
2. Replace `useMutation(api.X.Y)` → `useMutation(mutations.X.Y)`
3. Replace `Id<"games">` → `string` (or shared types package)
4. Replace `ConvexAuthProvider` → `RealtimeProvider` + Amplify Auth
5. Replace `@convex-dev/presence` → custom heartbeat via SDK

| Example / pattern | AWS rewrite file | Status |
|-------------------|------------------|--------|
| [`useGameController.ts`](../apps/web/src/hooks/useGameController.ts) | [`useGameController.aws.ts`](../apps/web/src/hooks/useGameController.aws.ts) | **Example only** |
| [`main.tsx`](../apps/web/src/main.tsx) | [`main.aws.tsx`](../apps/web/src/main.aws.tsx) | **Example only** |
| All other hooks/components | — | **Not started** |

---

## Infrastructure & ops

| Task | Status |
|------|--------|
| SAM template (DynamoDB + Lambda stub) | [`infra/backend/template.yaml`](../infra/backend/template.yaml) — **reference only** |
| API Gateway WebSocket routes wired in SAM | **Not started** |
| Cognito User Pool in IaC | **Not started** |
| EventBridge cron rules in IaC | **Not started** |
| SQS delay queues (engine, disconnect) | **Not started** |
| CI deploy job (replace `convex deploy`) | **Not started** |
| AWS Budget $5 alarm | **Not started** |
| Convex → DynamoDB data export script | **Not started** |
| Production cutover runbook | **Not started** |

---

## Suggested next steps (priority order)

1. **Port `joinByInvite`, `resign`, session ping/leave** — needed for any playable game beyond solo moves  
2. **Wire Cognito + Amplify** on frontend; replace auth stub  
3. **Port chat + presence** — lobby and in-game UX  
4. **Port seeks + invites** — matchmaking flows  
5. **Complete crons + SQS engine scheduling**  
6. **Port remaining queries** (spectate, leaderboard, pagination)  
7. **Migrate all frontend files** off Convex imports  
8. **Data migration script + staged cutover**  
9. **Deploy SAM stack + set `VITE_WS_URL`** (with billing alarm first)

---

## Related docs

- [AWS backend rewrite overview](./aws-backend-rewrite.md)
- Convex source: [`convex/`](../convex/)
- AWS backend source: [`packages/backend/`](../packages/backend/)
