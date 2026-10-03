# Slate — visualize and memorize DSA (MERN edition)

Slate started as a single-file prototype. This version is a full-stack platform: learners sign up, step through
algorithm visualizations, review spaced-repetition flashcards, earn XP and streaks, and compete on a live leaderboard.

**Stack:** MongoDB · Express 5 · React 19 (Vite) · Node 22 · plus Socket.IO, Redis (optional), nginx, Docker.

## What's new vs. the prototype

| Prototype | This version |
|---|---|
| Everything in one HTML file | Modular client (hooks, contexts, feature folders) and server (routes → controllers → services → models) |
| Flashcard progress in `window.storage` | Server-side SM-2 scheduling per user, so progress follows you across devices |
| No accounts | JWT auth (bcrypt), protected routes |
| Static content in JS | Algorithm catalog + code in 4 languages + flashcards stored in MongoDB, cached, seeded from JSON |
| — | XP, levels, daily streaks, 13-week activity heatmap |
| — | Live leaderboard + "learners online" via Socket.IO |
| — | Docker Compose with nginx load balancer, health checks, graceful shutdown, k6 load test |

## Architecture

```
            ┌────────── nginx (web) ───────────┐
 browser ──▶│ static React build               │
            │ /api, /socket.io ─ round-robin ──┼──▶ api replica 1 ┐
            └──────────────────────────────────┘    api replica 2 ├──▶ MongoDB
                                                    api replica N ┤──▶ Redis (cache, rate limits,
                                                                  ┘     socket adapter, presence)
```

```
server/src
  config/       env, db, redis, logger
  middleware/   auth (JWT), rate limits, validation (zod), error handling
  models/       User, Algorithm, Card, CardProgress, ReviewLog
  services/     srs (SM-2, pure), rewards (XP/streak), cache, token, events
  controllers/  auth, algorithms, cards, progress, leaderboard
  routes/       one router, all endpoints listed in one place
  sockets/      presence, live leaderboard hints, per-user XP events
  seed/         idempotent seeding from JSON
client/src
  api/          fetch wrapper + endpoint functions
  context/      Auth, Socket, Progress, Language
  hooks/        usePlayer (step engine), useAsync, useReportStep
  features/visualizer/   pure step generators (algorithms/) + SVG views + 3 visualizers
  pages/        Auth, Dashboard, Learn, Review, Leaderboard
```

## Run it

**Docker (recommended):**
```bash
cp .env.example .env            # set JWT_SECRET
docker compose up --build --scale api=3
# open http://localhost:8080
```

**Local dev** (needs MongoDB on localhost; Redis optional):
```bash
cd server && npm install && npm run seed && npm run dev      # API on :5000
cd client && npm install && npm run dev                      # UI on :5173 (proxies /api and /socket.io)
```

## How it scales to ~1000 concurrent users

- **Stateless API.** JWTs are verified locally; no sessions. Add replicas with `--scale api=N`; nginx re-resolves DNS and round-robins.
- **Multi-process per container** via `node:cluster` (`WEB_CONCURRENCY`) with automatic respawn.
- **Hot paths are indexed:** `{user, due}` for "what's due", `{user, card}` unique, `xp` desc for the leaderboard, `{user, day}` for the heatmap.
- **Read-through cache** (Redis, or in-memory fallback) with stampede protection for the catalog and leaderboard; 1000 users hitting the board cost one query per 10 s.
- **CPU stays on the client:** the visualizer step generators run in the browser, so the server only handles auth, scheduling and persistence.
- **Websocket-only Socket.IO + Redis adapter,** so no sticky sessions; leaderboard refresh hints are throttled server-side and jittered client-side to avoid thundering herds.
- **Rate limits keyed by user,** not IP (campus NAT would otherwise throttle a whole class); login attempts are limited per account.
- **Atomic rewards:** marking an algorithm explored and granting XP is one conditional update, so double-clicks and parallel tabs can't double-pay.
- **Operational basics:** `/healthz`, graceful SIGTERM shutdown, structured logs (pino), helmet, compression, body-size limits, bounded Mongo pools.

## API

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` · `/login` | – | rate limited |
| GET | `/api/auth/me` | ✓ | |
| GET | `/api/algorithms` · `/:slug` | – | cached |
| POST | `/api/algorithms/:slug/complete` | ✓ | +20 XP, first time only |
| GET | `/api/cards/categories` · `/session?cat=` | ✓ | due cards first, then ≤10 new |
| POST | `/api/cards/:id/review` | ✓ | `{rating: again\|hard\|good\|easy}` |
| GET | `/api/progress/summary` · `/activity` | ✓ | |
| GET | `/api/leaderboard` | ✓ | top 20 + your rank |

Socket events: `presence`, `leaderboard:dirty`, `xp:gained` (private to the user).

## Testing — what was actually run

```bash
cd server && npm test                 # 7 unit tests: SM-2, streaks, levels
cd server && npm run test:e2e         # 22 API checks against a real DB (set MONGO_URI)
cd server && npm run test:concurrency # 15 parallel "complete" calls -> 1 payout; 100 parallel learners
cd server && npm run test:smoke       # guards, validation, rate-limit headers, socket auth (no DB needed)
cd client && npm test                 # 7 component tests (jsdom, mocked API)
k6 run -e BASE=http://localhost:8080 loadtest/k6.js   # ramp to 1000 virtual users
```

**Honest caveats.** The integration tests were run against FerretDB (a MongoDB-compatible server on SQLite), because
MongoDB itself couldn't be installed in the build sandbox. They prove the logic and queries are correct, not
performance. The Docker/compose/nginx files, Redis code paths (shared cache, rate-limit store, socket adapter,
presence) and the k6 script were written but **not executed** — run `docker compose up` and the k6 script on your
machine before quoting any throughput numbers.

## Known gaps / next steps

- Not yet ported from the prototype: **Stack & Queue, Linked List, Recursion call-tree, and "Paste your code"** visualizers.
- Auth uses a single 7-day JWT in `localStorage`; a production hardening pass would add refresh tokens in httpOnly cookies and email verification.
- Streaks use UTC days, so they roll over at a fixed global time rather than local midnight.
- Next features worth adding: quiz mode, per-algorithm notes, admin UI for editing the catalog, OAuth login.
