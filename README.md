# Chess Lobby

**Play live:** [thechesslobby.com](https://thechesslobby.com)

Multiplayer chess with a React frontend and Convex real-time backend. An optional ASP.NET + Stockfish service exists for local development only.

## Features

- Sign in with **Google** or **email/password** (Convex Auth)
- User **profiles** (display name, bio, rating)
- **Dashboard** with live online players (`@convex-dev/presence`)
- Challenge online users, **invite links** for anonymous guests, or **play vs computer**
- **In-game chat** scoped to each match
- Server-validated moves via `chess.js` on Convex
- **Four UI themes** — switch anytime from the header

## UI themes

Screenshots from [thechesslobby.com](https://thechesslobby.com): landing, sign-in, lobby dashboard, and a vs-computer game.

### Ember Observatory (default)

| Landing | Sign in | Dashboard | Game |
|:---:|:---:|:---:|:---:|
| ![default landing](docs/screenshots/default/landing.png) | ![default login](docs/screenshots/default/login.png) | ![default dashboard](docs/screenshots/default/dashboard.png) | ![default game](docs/screenshots/default/game.png) |

### Atelier Grid (bento)

| Landing | Sign in | Dashboard | Game |
|:---:|:---:|:---:|:---:|
| ![bento landing](docs/screenshots/bento/landing.png) | ![bento login](docs/screenshots/bento/login.png) | ![bento dashboard](docs/screenshots/bento/dashboard.png) | ![bento game](docs/screenshots/bento/game.png) |

### Pawn Riot (brutal)

| Landing | Sign in | Dashboard | Game |
|:---:|:---:|:---:|:---:|
| ![brutal landing](docs/screenshots/brutal/landing.png) | ![brutal login](docs/screenshots/brutal/login.png) | ![brutal dashboard](docs/screenshots/brutal/dashboard.png) | ![brutal game](docs/screenshots/brutal/game.png) |

### Obsidian Atelier (atelier)

| Landing | Sign in | Dashboard | Game |
|:---:|:---:|:---:|:---:|
| ![atelier landing](docs/screenshots/atelier/landing.png) | ![atelier login](docs/screenshots/atelier/login.png) | ![atelier dashboard](docs/screenshots/atelier/dashboard.png) | ![atelier game](docs/screenshots/atelier/game.png) |

## Architecture

### What runs where (production)

| Layer | Platform | What it does |
|-------|----------|----------------|
| **Frontend** | **AWS** (S3 + CloudFront) | Serves the built React app (HTML, JS, CSS, assets) |
| **Backend** | **Convex Cloud** | Auth, database, real-time games, chat, lobby presence, vs-computer moves |
| **CI deploy** | **GitHub Actions** | Builds the SPA, syncs to S3, invalidates CloudFront; deploys Convex |
| **Chess engine** | **Convex** (built-in) | Minimax via `chess.js` — no separate engine server in prod |
| **Stockfish API** | *Not deployed* | `apps/chess-engine` is local/optional only |

**On AWS (stack `chess-lobby-demo`):** S3 (static build), CloudFront (HTTPS CDN, SPA fallback to `index.html`), IAM OIDC role for GitHub Actions deploys.

**Not on AWS:** Convex, auth, game state, chat, or the built-in computer opponent.

### Production diagram

```mermaid
flowchart LR
  subgraph gh [GitHub Actions]
    WF[Deploy workflow]
  end

  subgraph aws [AWS]
    S3[S3 bucket]
    CF[CloudFront]
  end

  subgraph convex [Convex Cloud]
    ConvexAuth[Auth and API]
    DB[(Database)]
    Engine[Minimax engine]
  end

  Browser[Browser]

  Browser -->|HTTPS| CF
  CF --> S3
  Browser <-->|WebSocket| ConvexAuth
  WF -->|upload| S3
  WF -->|deploy| ConvexAuth
  Engine --> DB
```

### Local development

Locally, the Vite dev server replaces CloudFront/S3, and Convex **dev** replaces production. You can optionally run the .NET Stockfish service and set `ENGINE_API_URL` on the dev deployment.

## Monorepo layout

```
chess-lobby/
├── apps/web/           # React + Vite + Tailwind
├── apps/chess-engine/  # ASP.NET Core 8 + Stockfish (UCI)
├── convex/             # Convex backend
└── chess-lobby.sln
```

## Prerequisites

- Node.js 18+
- .NET 8 SDK
- Stockfish (for local engine): `stockfish` on PATH, or use Docker

## Quick start (local)

### 1. Install dependencies

```bash
npm install
```

### 2. Convex backend

```bash
npx convex dev
```

This creates `.env.local` with `CONVEX_URL`. Copy to the web app:

```bash
# apps/web/.env.local
VITE_CONVEX_URL=<same as CONVEX_URL from root .env.local>
```

Configure Convex Auth (required for sign-in):

```bash
node scripts/setup-auth.mjs
npx convex env set AUTH_GOOGLE_ID <google-oauth-client-id>      # optional
npx convex env set AUTH_GOOGLE_SECRET <google-oauth-client-secret> # optional
```

Google OAuth redirect URI: `https://<deployment>.convex.site/api/auth/callback/google`

### 3. Play vs computer

**Works out of the box** — Convex runs a built-in chess engine (minimax via chess.js) after your move. No local engine required for dev.

For **Stockfish-level strength**, deploy the .NET engine service publicly and point Convex at it:

```bash
cd apps/chess-engine
dotnet run   # requires stockfish on PATH, or use docker compose up chess-engine
npx convex env set ENGINE_API_URL https://your-public-engine-url
npx convex env set ENGINE_API_KEY dev-secret
```

`ENGINE_API_URL=http://localhost:5000` does **not** work with cloud Convex — localhost is only reachable on your PC, not from Convex servers.

### 4. Web app

```bash
npm run dev:web
```

Open http://localhost:5173

## Production hosting (minimal demo)

| Component | Host | URL / resource |
|-----------|------|----------------|
| React SPA | **AWS S3 + CloudFront + Route 53** | https://thechesslobby.com |
| Convex prod | **Convex Cloud** | https://pastel-buffalo-515.convex.cloud |
| Vs computer | **Convex built-in engine** | (no extra URL) |

**Est. cost:** ~$0–2/mo (AWS static hosting) + Convex free tier.

Step-by-step setup: **[docs/deploy-demo.md](docs/deploy-demo.md)**

Optional Stockfish engine on AWS (~$7–10/mo): **[docs/deploy-engine-lightsail.md](docs/deploy-engine-lightsail.md)**  
Stack outputs: **[docs/demo-aws-outputs.env.example](docs/demo-aws-outputs.env.example)**  
CI deploy: [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml) (Actions → **Deploy AWS** → Run workflow)

Optional Stockfish (.NET engine) is for local dev only; production does not set `ENGINE_API_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Vite dev server |
| `npm run convex:dev` | Convex dev deployment |
| `npm run build:web` | Production React build |
| `npm run screenshots:readme` | Capture README screenshots (Playwright) |
| `dotnet run --project apps/chess-engine` | Engine API |

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_CONVEX_URL` | `apps/web` | Convex client URL |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Convex | Google OAuth |
| `SITE_URL` | Convex | OAuth redirect base |
| `ENGINE_API_URL` / `ENGINE_API_KEY` | Convex | Stockfish service |
| `ENGINE_API_KEY` | chess-engine | API auth |
