# NexusToolkit — Architecture & Anti-Breaking System

---

## Architecture Diagram (text)

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Browser)                                         │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Service Worker │  │   React App       │  │  IndexedDB    │  │
│  │  - offline cache│  │  - Vite + Zustand │  │  - pending    │  │
│  │  - bg sync      │  │  - 3 tool views   │  │    queues     │  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │  REST / fetch
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  API GATEWAY (Express)                                          │
│  helmet · cors · morgan · express-rate-limit · error middleware │
└──────────┬──────────────────┬──────────────────────┬───────────┘
           │                  │                      │
           ▼                  ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ URL Module   │   │ Files Module     │   │ Text Module      │
│              │   │                  │   │                  │
│ routes       │   │ routes           │   │ routes           │
│ controller   │   │ controller       │   │ controller       │
│ service      │   │ service          │   │ service          │
│ repository   │   │ repository       │   │ repository       │
│ schema       │   │ schema           │   │ schema           │
└──────┬───────┘   └───────┬──────────┘   └────────┬─────────┘
       │                   │                        │
       └───────────────────┼────────────────────────┘
                           │
          ┌────────────────┴──────────────────┐
          ▼                                   ▼
  ┌──────────────┐                   ┌───────────────┐
  │   MongoDB    │                   │     Redis     │
  │  (truth)     │                   │   (speed)     │
  │              │                   │               │
  │  urls        │                   │  url:redirect │
  │  files       │◄──── read-through │  url:stats    │
  │  pastes      │◄──── write-through│  paste:*      │
  └──────────────┘                   └───────────────┘
          │
          ▼
  ┌──────────────┐
  │ File System  │
  │  /uploads    │
  └──────────────┘
```

---

## File Structure Reference

```
nexus-toolkit/
├── package.json                      ← monorepo root (npm workspaces)
├── .env.example                      ← copy to .env, fill in values
├── .gitignore
│
├── apps/
│   ├── api/                          ← Node.js + Express backend
│   │   ├── package.json
│   │   └── src/
│   │       ├── server.js             ← entry: DB connect → listen
│   │       ├── app.js                ← Express app: middleware + routes
│   │       │
│   │       ├── config/
│   │       │   ├── index.js          ← all config values + env validation
│   │       │   ├── database.js       ← MongoDB connect/disconnect + retry
│   │       │   └── redis.js          ← Redis client + get/set/del helpers
│   │       │
│   │       ├── modules/
│   │       │   ├── url/
│   │       │   │   ├── url.schema.js      ← Mongoose model + TTL index
│   │       │   │   ├── url.repository.js  ← DB operations only
│   │       │   │   ├── url.service.js     ← business logic + Joi validation
│   │       │   │   ├── url.controller.js  ← HTTP handlers, ResponseFactory
│   │       │   │   └── url.routes.js      ← Router + rate limiters
│   │       │   ├── files/             ← same 5-file pattern
│   │       │   └── text/              ← same 5-file pattern
│   │       │
│   │       └── shared/
│   │           ├── errors/
│   │           │   ├── AppError.js    ← custom error class
│   │           │   └── errorCodes.js  ← machine-readable constants
│   │           ├── middleware/
│   │           │   ├── error.middleware.js    ← global error handler (last)
│   │           │   ├── rateLimit.middleware.js← named limiters per route
│   │           │   └── upload.middleware.js   ← multer + type/size filter
│   │           └── utils/
│   │               ├── response.factory.js  ← success() / error() / redirect()
│   │               ├── hash.js              ← nanoid short code generator
│   │               └── logger.js            ← Winston structured logger
│   │
│   └── web/                          ← React + Vite frontend (PWA)
│       ├── package.json
│       ├── vite.config.js            ← Vite + PWA plugin config
│       ├── index.html
│       ├── public/
│       │   └── manifest.json
│       └── src/
│           ├── main.jsx              ← React entry
│           ├── App.jsx               ← shell: tabs, toasts, offline banner
│           ├── features/
│           │   ├── url/
│           │   │   ├── UrlShortener.jsx  ← form, result, offline queue
│           │   │   └── url.api.js        ← fetch wrapper
│           │   ├── files/
│           │   │   ├── FileShare.jsx     ← drag-drop, progress, result
│           │   │   └── files.api.js      ← XHR for progress events
│           │   └── text/
│           │       ├── TextShare.jsx     ← textarea, language, burn option
│           │       └── text.api.js       ← fetch wrapper
│           ├── shared/
│           │   └── hooks/
│           │       └── useOffline.js     ← online/offline + background sync
│           ├── store/
│           │   ├── useStore.js           ← Zustand: isOnline, toasts, activeTab
│           │   └── offlineDB.js          ← IndexedDB: pending queues + cache
│           └── styles/
│               └── index.css            ← dark industrial design system
│
├── docs/
│   ├── ARCHITECTURE.md           ← this file
│   ├── AI_SYSTEM_PROMPT.md       ← paste into any AI tool before coding
│   └── SCALING_RULES.md          ← when to do what at each traffic level
│
└── docker/
    ├── Dockerfile.api             ← multi-stage, non-root user
    └── docker-compose.yml        ← MongoDB + Redis + API
```

---

## The System to Stop AI Projects From Breaking

These 8 rules are how the project stays coherent even when AI writes most of the code.

### Rule 1 — The AI System Prompt Is the Source of Truth

`docs/AI_SYSTEM_PROMPT.md` encodes every architectural decision.
Before starting any AI-assisted coding session, paste it into the context window.
If a new decision is made that contradicts it, update the prompt first, then code.

**Why it works:** AI models follow the instructions in their context.
Explicit rules outperform "the AI should know this."

### Rule 2 — One Pattern Per Problem

Every module uses the **exact same 5-file pattern**:
`schema → repository → service → controller → routes`

AI tools generate consistent code when the pattern is consistent.
If you let module structures drift (e.g. "this one has a helper.js"), the AI
starts inventing new structures for every module.

### Rule 3 — Shared/ Is the Contract

If you want two modules or two AI sessions to agree on error handling,
response format, or utilities — put the implementation in `shared/` first.

AI sessions that start from `AppError` + `ResponseFactory` + `errorCodes.js`
will produce consistent code. Sessions that don't reference them will invent
their own inconsistent versions.

### Rule 4 — Fail Fast on Config

The config validator in `config/index.js` throws on startup if required env vars
are missing. This prevents the most common class of production bug: deploying
without a required environment variable and only finding out under real traffic.

### Rule 5 — Graceful Shutdown Is Not Optional

`server.js` handles `SIGTERM` and `SIGINT` with a drain-then-close pattern.
This means deployments never drop in-flight requests.
AI tools often omit graceful shutdown. The template includes it — keep it.

### Rule 6 — Errors Classify Themselves

`AppError` has `isOperational: true`. The error middleware uses this flag
to decide whether to expose the message to the client.

Unexpected errors (programming bugs) return a generic 500. Only `AppError`
messages reach the client. This prevents internal details from leaking.

### Rule 7 — Rate Limits Are Per Endpoint, Not Global

A single global rate limiter is easy to bypass (one slow-drip request pattern)
and too aggressive for legitimate traffic patterns.
Named limiters per endpoint (`urlCreateLimiter`, `fileUploadLimiter`, etc.)
allow tuning each endpoint independently as traffic data comes in.

### Rule 8 — Logs Tell You Which Layer Failed

Winston logs include the layer prefix: `[db]`, `[redis]`, `[server]`, `[error]`.
When debugging, you read the prefix first to know which file to open.
This is faster than grepping for a function name across the whole codebase.

---

## Workflow for Every Code Change

```
1. Read AI_SYSTEM_PROMPT.md                  ← refresh the contract
2. Identify the affected module + layer       ← which of the 5 files?
3. Check shared/ for existing utilities       ← don't duplicate
4. Write the change                           ← follow the layer rules
5. Verify the response shape                  ← ResponseFactory envelope?
6. Verify error paths                         ← AppError + errorCodes?
7. If a new config value is needed            ← add to config/index.js first
8. If a new endpoint is added                 ← add rate limiter
9. If a hot path is added                     ← add Redis caching
10. Test with curl before wiring the frontend ← isolate backend first
```
