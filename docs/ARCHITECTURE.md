# NextShare (NexusToolkit) — Architecture & System Design

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Browser — nextsharebymeet.vercel.app)                 │
│                                                                      │
│  ┌──────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Landing     │  │   React SPA (/app) │  │  Service Worker     │  │
│  │  Page (/)    │  │  Vite + Zustand    │  │  Workbox / PWA      │  │
│  │  Pure HTML   │  │  3 tools + admin   │  │  offline cache      │  │
│  └──────────────┘  └───────────────────┘  └─────────────────────┘  │
│                              │                        │              │
│                    ┌─────────┴──────────┐             │              │
│                    │    IndexedDB        │◄────────────┘              │
│                    │  (offlineDB.js)     │                            │
│                    │  pending queues     │                            │
│                    └─────────────────────┘                           │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  REST / fetch
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  EXPRESS MIDDLEWARE STACK (Render)                                   │
│                                                                      │
│  helmet → cors → json → morgan → visitorMiddleware → generalLimiter  │
│                                                                      │
│  visitorMiddleware: sAdd('visitors:global', ip) — every request      │
└──────────┬──────────────────┬───────────────────────┬───────────────┘
           │                  │                       │
           ▼                  ▼                       ▼
┌──────────────┐   ┌───────────────────┐   ┌──────────────────┐
│  URL Module  │   │  Files Module     │   │  Text Module     │
│              │   │                   │   │                  │
│  routes      │   │  routes           │   │  routes          │
│  controller──┼──►│  controller───────┼──►│  controller      │
│  + IP track  │   │  + IP track       │   │  + IP track      │
│  service     │   │  service          │   │  service         │
│  repository  │   │  repository       │   │  repository      │
│  schema      │   │  schema           │   │  schema          │
└──────┬───────┘   └────────┬──────────┘   └───────┬──────────┘
       │                    │                       │
       └────────────────────┼───────────────────────┘
                            │
         ┌──────────────────┴────────────────────┐
         ▼                                       ▼
 ┌──────────────┐                       ┌────────────────┐
 │   MongoDB    │                       │     Redis      │
 │  (truth)     │                       │   (speed)      │
 │              │                       │                │
 │  Url         │◄──── read-through     │ url:redirect:* │
 │  Paste       │◄──── write-through    │ url:stats:*    │
 │  File        │                       │ paste:*        │
 └──────────────┘                       │ visitors:*     │
         │                              └────────────────┘
         ▼
 ┌──────────────┐
 │  Filesystem  │
 │  /uploads    │
 └──────────────┘

 ┌──────────────────────────────────────────┐
 │  Admin Module (/admin)                   │
 │                                          │
 │  admin.routes.js   — x-admin-secret auth │
 │  admin.controller  — reads mongoose +    │
 │                      Redis sCard directly│
 │                      (no service layer)  │
 └──────────────────────────────────────────┘
```

---

## Request Lifecycle

### URL Redirect (hot path)
```
GET /:code
     │
     ▼
urlRedirectLimiter
     │
     ▼
visitorMiddleware ──► sAdd('visitors:global', ip)
     │
     ▼
UrlController.redirect
     │
     ▼
UrlService.resolve(code)
     │
     ├── Redis HIT ──► return originalUrl
     │                  sAdd('visitors:url:{code}', ip)  [fire-and-forget]
     │                  incrementClicks [setImmediate]
     │
     └── Redis MISS ──► MongoDB lookup
                         └── re-warm Redis
                         └── return originalUrl
                         └── sAdd('visitors:url:{code}', ip)  [fire-and-forget]
                         └── incrementClicks [setImmediate]
     │
     ▼
ResponseFactory.redirect(res, originalUrl)
```

### Paste Create
```
POST /api/pastes
     │
     ▼
TextService.create(payload)
     │
     ├── Joi validation
     ├── generateShortCode()
     ├── TextRepository.create(...)
     ├── Redis cache (skip if burnAfterRead)
     └── return { shortCode, shareUrl (frontendUrl based), ... }
     │
     ▼
Controller overrides nothing — frontend overrides shareUrl with window.location.origin
```

### Admin Stats
```
GET /admin/stats
     │
     ▼
admin.routes middleware — checks x-admin-secret header
     │
     ▼
AdminController.stats
     │
     ├── redis.sCard('visitors:global')
     ├── mongoose.model('Url').find() + sCard per shortCode
     ├── mongoose.model('Paste').find() + sCard per shortCode
     └── mongoose.model('File').find() + sCard per shortCode
     │
     ▼
res.json({ success: true, data: { globalVisitors, totals, urls, pastes, files } })
```

---

## Data Models

### Url
```
shortCode      String  unique, indexed       — primary lookup key
originalUrl    String  max 2048
title          String  max 255, optional
clicks         Number  default 0             — total click counter
clickLog       [Date]  select: false         — sparse log, last 1000
expiresAt      Date    nullable              — TTL index
isActive       Boolean indexed
createdBy      String  IP or 'anonymous'
createdAt      Date    auto
updatedAt      Date    auto

Indexes: shortCode (unique), expiresAt (TTL sparse), isActive+createdAt (compound)
Virtual: isExpired
```

### Paste
```
shortCode      String  unique, indexed
content        String  max 500,000 chars
language       String  enum (23 languages), default 'plaintext'
title          String  max 255, optional
expiresAt      Date    nullable              — TTL index
burnAfterRead  Boolean default false         — destroy on first view
viewCount      Number  default 0
isActive       Boolean indexed
createdBy      String  IP or 'anonymous'
createdAt      Date    auto
updatedAt      Date    auto

Indexes: shortCode (unique), expiresAt (TTL sparse), isActive (single)
```

### File
```
shortCode      String  unique, indexed
storedName     String  disk filename (token + ext)
originalName   String  user's original filename, max 255
mimeType       String
size           Number  bytes
downloadCount  Number  default 0
maxDownloads   Number  nullable (null = unlimited)
password       String  bcrypt hash, select: false
expiresAt      Date    nullable              — TTL index
isActive       Boolean indexed
uploadedBy     String  IP or 'anonymous'
createdAt      Date    auto
updatedAt      Date    auto

Indexes: shortCode (unique), expiresAt (TTL sparse), isActive (single)
```

---

## Redis Key Reference

| Key                     | Type   | TTL      | Contents                        |
|-------------------------|--------|----------|---------------------------------|
| `visitors:global`       | Set    | Forever  | All unique visitor IPs          |
| `visitors:url:{code}`   | Set    | Forever  | Unique IPs per short URL        |
| `visitors:paste:{code}` | Set    | Forever  | Unique IPs per paste            |
| `visitors:file:{code}`  | Set    | Forever  | Unique IPs per file download    |
| `url:redirect:{code}`   | String | 1 hour   | `{ originalUrl, expiresAt }`    |
| `url:stats:{code}`      | String | 5 min    | Full stats object               |
| `paste:{code}`          | String | 10 min   | Paste content + metadata        |

---

## Environment Variables

### Backend (Render)
```
MONGODB_URI        required   MongoDB Atlas connection string
REDIS_URL          required   Redis connection string
PORT               optional   Default 3001
NODE_ENV           optional   development | production
BASE_URL           required   API server URL (e.g. https://api.render.com)
FRONTEND_URL       required   Frontend URL (e.g. https://nextsharebymeet.vercel.app)
CORS_ORIGIN        optional   Primary allowed origin
ADMIN_SECRET       required   Random secret for admin dashboard access
JWT_SECRET         optional   For future auth features
UPLOAD_DIR         optional   Default ./uploads
MAX_FILE_SIZE      optional   Default 52428800 (50MB)
RATE_LIMIT_WINDOW_MS optional  Default 900000 (15 min)
RATE_LIMIT_MAX     optional   Default 100
```

### Frontend (Vercel)
```
VITE_API_URL       required   Backend API URL
```

---

## File Structure

```
NextShare/
├── package.json                       ← monorepo root (npm workspaces)
├── .env.example
├── .gitignore
│
├── apps/
│   ├── api/                           ← Node.js + Express backend (Render)
│   │   ├── package.json
│   │   └── src/
│   │       ├── server.js              ← entry: DB connect → listen + graceful shutdown
│   │       ├── app.js                 ← Express: middleware stack + all routes
│   │       │
│   │       ├── config/
│   │       │   ├── index.js           ← all config + env validation (fail-fast)
│   │       │   ├── database.js        ← MongoDB connect/disconnect + retry
│   │       │   └── redis.js           ← Redis client + get/set/del helpers
│   │       │
│   │       ├── modules/
│   │       │   ├── url/               ← 5-file pattern
│   │       │   │   ├── url.schema.js
│   │       │   │   ├── url.repository.js
│   │       │   │   ├── url.service.js
│   │       │   │   ├── url.controller.js  ← IP tracking: visitors:url:{code}
│   │       │   │   └── url.routes.js
│   │       │   ├── files/             ← 5-file pattern
│   │       │   │   ├── files.schema.js
│   │       │   │   ├── files.repository.js
│   │       │   │   ├── files.service.js
│   │       │   │   ├── files.controller.js  ← IP tracking: visitors:file:{code}
│   │       │   │   └── files.routes.js
│   │       │   ├── text/              ← 5-file pattern
│   │       │   │   ├── text.schema.js
│   │       │   │   ├── text.repository.js
│   │       │   │   ├── text.service.js
│   │       │   │   ├── text.controller.js  ← IP tracking: visitors:paste:{code}
│   │       │   │   └── text.routes.js
│   │       │   └── admin/             ← 2-file exception (read-only, no service layer)
│   │       │       ├── admin.controller.js ← reads mongoose + Redis directly
│   │       │       └── admin.routes.js     ← x-admin-secret middleware
│   │       │
│   │       └── shared/
│   │           ├── errors/
│   │           │   ├── AppError.js
│   │           │   └── errorCodes.js
│   │           ├── middleware/
│   │           │   ├── error.middleware.js
│   │           │   ├── rateLimit.middleware.js
│   │           │   ├── upload.middleware.js
│   │           │   └── visitor.middleware.js  ← sAdd('visitors:global', ip)
│   │           └── utils/
│   │               ├── response.factory.js
│   │               ├── hash.js
│   │               └── logger.js
│   │
│   └── web/                           ← React + Vite frontend (Vercel)
│       ├── package.json               ← type: module (ESM only)
│       ├── vite.config.js             ← MPA: landing.html + index.html
│       ├── vercel.json                ← rewrites: /app /paste/:code /admin → SPA
│       ├── index.html                 ← React SPA entry
│       ├── landing.html               ← Pure HTML landing page (served at /)
│       ├── public/
│       │   ├── favicon.svg
│       │   ├── icon-192.png
│       │   ├── icon-512.png
│       │   └── manifest.json
│       └── src/
│           ├── main.jsx               ← routing: /paste/:code | everything else
│           ├── App.jsx                ← routing: /admin | tab app
│           ├── features/
│           │   ├── admin/
│           │   │   └── AdminDashboard.jsx  ← secret-gated analytics UI
│           │   ├── url/
│           │   │   ├── UrlShortener.jsx
│           │   │   └── url.api.js
│           │   ├── files/
│           │   │   ├── FileShare.jsx
│           │   │   └── files.api.js
│           │   └── text/
│           │       ├── TextShare.jsx       ← overrides shareUrl with window.location.origin
│           │       ├── PasteViewer.jsx
│           │       └── text.api.js
│           ├── shared/hooks/
│           │   └── useOffline.js      ← online/offline + background sync
│           ├── store/
│           │   ├── useStore.js        ← Zustand: isOnline, toasts, activeTab
│           │   └── offlineDB.js       ← IndexedDB: pending queues + cache
│           └── styles/
│               └── index.css
│
├── docs/
│   ├── AI_SYSTEM_PROMPT.md
│   ├── ARCHITECTURE.md
│   └── SCALING_RULES.md
│
└── docker/
    ├── Dockerfile.api
    └── docker-compose.yml
```

---

## Frontend Routing Map

```
nextsharebymeet.vercel.app/
│
├── /                    → landing.html (pure HTML, Vite MPA)
├── /app                 → index.html (React SPA) → App.jsx → tab app
├── /paste/:code         → index.html → main.jsx → PasteViewer
└── /admin               → index.html → App.jsx → AdminDashboard
                                                   (requires x-admin-secret in header)
```

---

## The 8 Rules That Keep This Project Coherent

**Rule 1 — AI System Prompt is the source of truth.**
Paste AI_SYSTEM_PROMPT.md into every AI coding session before writing code.
Update it first when making architectural decisions.

**Rule 2 — One pattern per problem.**
Every feature module uses the exact same 5-file pattern. Admin is the only exception,
and it's explicitly documented. Drift here causes AI tools to invent new structures.

**Rule 3 — shared/ is the contract.**
Error handling, response format, and utilities live in shared/ so all modules
and AI sessions agree on them without re-inventing.

**Rule 4 — Fail fast on config.**
config/index.js throws on startup if MONGODB_URI or REDIS_URL are missing.
This catches deploy misconfiguration before it hits users.

**Rule 5 — Graceful shutdown is not optional.**
server.js handles SIGTERM/SIGINT with drain-then-close. Never omit this on deploys.

**Rule 6 — Errors classify themselves.**
AppError.isOperational = true tells errorMiddleware it's safe to send the message
to clients. Unexpected errors return generic 500. Internal details never leak.

**Rule 7 — Visitor tracking is always fire-and-forget.**
Redis Set operations for analytics must never block the user-facing response.
Always .catch(() => {}) and never await in hot paths.

**Rule 8 — Frontend is ESM only.**
Never use require() in apps/web/src/. It compiles but fails at runtime in the
browser with "require is not defined" — causing a complete black screen.