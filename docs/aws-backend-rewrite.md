# AWS Backend Rewrite (feature branch)

This branch explores migrating Chess Lobby off Convex to an AWS-native stack. **Nothing here is deployed or wired into production** — it is a code-only spike on `feature/aws-backend-rewrite`.

## Architecture

```
React SPA  ──WebSocket──►  API Gateway WebSocket  ──►  Lambda handlers
                              │                              │
                              │                              ▼
                              └── postToConnection ◄──  DynamoDB + Streams
```

## What's included

| Path | Purpose |
|------|---------|
| [`packages/backend/`](../packages/backend/) | Lambda handler code, DynamoDB repositories, ported game logic |
| [`apps/web/src/lib/realtime/`](../apps/web/src/lib/realtime/) | Thin `useQuery` / `useMutation` client over WebSocket |
| [`apps/web/src/main.aws.tsx`](../apps/web/src/main.aws.tsx) | Alternate app entry using `RealtimeProvider` instead of Convex |
| [`apps/web/src/hooks/useGameController.aws.ts`](../apps/web/src/hooks/useGameController.aws.ts) | Example hook migration from Convex |
| [`infra/backend/template.yaml`](../infra/backend/template.yaml) | SAM template (reference only — do not deploy from CI yet) |

## Convex → AWS mapping

| Convex | AWS rewrite |
|--------|-------------|
| `useQuery(api.games.get, …)` | `useQuery(channels.games.get, { gameId, guestSessionId })` |
| `useMutation(api.games.makeMove)` | `useMutation(mutations.games.makeMove)` |
| `ctx.db` | DynamoDB repositories in `packages/backend/src/db/` |
| `ctx.scheduler.runAfter` | SQS delay queue (TODO in handlers) |
| `@convex-dev/auth` | Cognito JWT verification in `packages/backend/src/auth/` |
| Crons in `convex/crons.ts` | EventBridge → Lambda in `handlers/crons/` |

## Environment variables (when deployed)

| Variable | Used by |
|----------|---------|
| `VITE_WS_URL` | Frontend WebSocket URL |
| `VITE_API_URL` | REST fallback for pagination |
| `COGNITO_USER_POOL_ID` | Lambda JWT verification |
| `COGNITO_CLIENT_ID` | Lambda JWT audience |
| `WEBSOCKET_API_ENDPOINT` | Lambda Management API fan-out |

## How to try the frontend SDK locally

The main app still uses Convex (`main.tsx`). To experiment with the AWS client:

1. Set `VITE_WS_URL` in `apps/web/.env.local`
2. Point Vite entry to `main.aws.tsx` (manual change for now)
3. Run a local WebSocket mock or deploy the SAM stack yourself

## Migration status

- [x] Domain types + ported pure game logic
- [x] DynamoDB repositories (games, users, connections, subscriptions)
- [x] Core games service (get, create, makeMove)
- [x] WebSocket handler skeleton + stream fan-out
- [x] Frontend realtime SDK + example hook
- [ ] Remaining Convex endpoints (invites, seeks, chat, presence, leaderboard)
- [ ] Cognito + Amplify auth integration on frontend
- [ ] Data export/import from Convex
- [ ] Full cron port + engine SQS scheduling
- [ ] Production cutover

## Cost note

At low traffic (<10 users), this serverless stack runs mostly within AWS free tier — operational cost is pennies, not tens of dollars. The real cost is engineering time to finish the migration.

## Do not merge to main

This branch is for review only until the remaining endpoints and auth are ported and tested end-to-end.
