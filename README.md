# PODNASRAL

14-day streaming event platform. Streamers compete for points through game auctions, HLTB-based scoring, loot, and a world boss.

## Stack

- Next.js 15, React 19, TypeScript, Tailwind 4
- PostgreSQL + Prisma 6
- NextAuth (Twitch OAuth)

## Deploy (free)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/leshapudge/strimkraft)

Подробно: [DEPLOY.md](./DEPLOY.md)

## Setup

```bash
cp .env.example .env
# Configure DATABASE_URL, AUTH_SECRET, Twitch credentials

npm install
npx prisma db push
npm run db:seed
npm run dev
```

## Key routes

- `/` — Observer dashboard (all streamers)
- `/streamer` — Streamer panel (auction, session, craft)
- `/admin` — Event admin
- `/api/v1/*` — REST API
- `/api/v1/live` — SSE live updates

## API map (ported from v1 + v2 domain)

### Infra
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | — |
| GET | `/api/auth/me` | session |
| GET | `/api/v1/me` | session (streamer profile) |

### Public
| GET | `/api/v1/event`, `/leaderboard`, `/boss`, `/feed`, `/live` (SSE) |
| GET | `/api/v1/participants/:id` |
| GET | `/api/v1/games/search?q=` |
| GET | `/api/v1/catalog-games`, `/items`, `/craft-recipes` |

### Streamer flow
`POST /auctions` → `modifiers` → `start` → `sessions/:id/roll-difficulty` → `confirm` → `pause`/`resume` → `complete`/`drop`

### Admin CRUD (from v1 crud-factory)
| Resource | Path |
|----------|------|
| Users | `/api/v1/users` |
| Events | `/api/v1/events` |
| Participants | `/api/v1/participants` |
| Catalog games | `/api/v1/catalog-games` |
| Items | `/api/v1/items` |
| Craft recipes | `/api/v1/craft-recipes` |
| Craft ingredients | `/api/v1/craft-ingredients` |
| Bosses | `/api/v1/bosses` |
| Game sessions | `/api/v1/game-sessions` |
| Activity logs | `/api/v1/activity-logs` |
| Stats | `/api/v1/admin/stats` |

Response format: `{ success: true, data, meta? }` or `{ success: false, error }`.

### Typed client
```ts
import { api, connectLive } from "@/lib/api/client";
const event = await api.getEvent();
connectLive((e) => console.log(e.type));
```
