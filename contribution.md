# Contributing to NextShare

Thanks for your interest in contributing. This document covers everything you need to get
started — setup, project conventions, and what a good pull request looks like.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Rules](#architecture-rules)
- [Frontend Conventions](#frontend-conventions)
- [Backend Conventions](#backend-conventions)
- [Adding a New Module](#adding-a-new-module)
- [Environment Variables](#environment-variables)
- [Running Tests and Linting](#running-tests-and-linting)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [What to Work On](#what-to-work-on)
- [What Not to Do](#what-not-to-do)

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7 (or let the dev fallback handle it — see below)
- Redis 7 (optional locally; app degrades gracefully without it)
- Docker (optional, but recommended for a clean environment)

### Local setup

```bash
git clone https://github.com/ivengexnce/NextShare.git
cd NextShare
npm install
cp .env.example .env
# Fill in your values — MONGODB_URI and BASE_URL are the minimum for local dev
```

Start both apps:

```bash
cd apps/api && npm run dev     # backend on :3001 (or your configured port)
cd apps/web && npm run dev     # frontend on :5173
```

Or with Docker:

```bash
docker compose up
```

The API has an automatic MongoMemoryServer fallback when `MONGODB_URI` is not set,
so you can run the backend with zero external dependencies for quick local testing.

---

## Project Structure

```
NextShare/
├── apps/
│   ├── api/src/
│   │   ├── config/          # DB, Redis, env initialisation
│   │   ├── modules/
│   │   │   ├── admin/       # Read-only analytics — documented exception to layering
│   │   │   ├── files/       # controller · service · repository · schema · routes
│   │   │   ├── text/        # controller · service · repository · schema · routes
│   │   │   └── url/         # controller · service · repository · schema · routes
│   │   └── shared/
│   │       ├── errors/      # AppError, errorCodes
│   │       ├── middleware/  # error, rateLimit, upload, visitor
│   │       └── utils/       # hash, logger, response.factory
│   └── web/src/
│       ├── features/        # One folder per domain — mirrors the API modules
│       ├── shared/hooks/
│       ├── store/           # Zustand store + IndexedDB (offlineDB.js)
│       └── styles/
├── docs/                    # ARCHITECTURE.md, SCALING_RULES.md
└── docker/
```

---

## Architecture Rules

These are non-negotiable. Every PR will be checked against them.

### Backend layer contract

```
Controller  →  Service  →  Repository  →  Schema/Model
```

| Layer | Responsibility | What it must NOT do |
|---|---|---|
| Controller | Parse req, call service, send res | Contain business logic or query the DB |
| Service | Business logic, validation, orchestration | Touch req/res or query the DB directly |
| Repository | All database operations | Contain business logic |
| Schema | Data shape (Mongoose) | Contain logic of any kind |

The `admin` module is the only deliberate exception — it is read-only and talks to
MongoDB/Redis directly. Do not use it as a template for new modules.

### Cache-aside pattern

MongoDB is the source of truth. Redis is a speed layer.

- Read: check Redis first → on miss, read MongoDB → populate Redis.
- Write: write MongoDB first → invalidate or update Redis.
- If Redis is unavailable, the app must continue to work correctly, just slower.

---

## Frontend Conventions

- **ESM only.** Never use `require()` anywhere in `apps/web`. It breaks Vite and Vercel builds.
- State lives in Zustand (`src/store/useStore.js`). Do not reach for a new state library.
- Offline support matters. If your feature touches data that a user might want offline,
  consider whether it belongs in `offlineDB.js` and the background sync queue.
- API calls go in the feature-level `*.api.js` file (e.g. `url.api.js`), not inside components.
- Keep components in `src/features/<domain>/`. Shared UI that spans more than one domain
  goes in `src/shared/`.

---

## Backend Conventions

- Use `AppError` from `shared/errors/` for all thrown errors. Do not throw raw `Error` objects.
- Use `response.factory` from `shared/utils/` for all API responses. Keep the response shape consistent.
- Rate limiting is handled by the shared middleware. Apply it at the route level for any
  new endpoint that accepts user input.
- Visitor tracking middleware is already wired — you do not need to instrument it in new routes
  unless you are adding a new trackable resource type, in which case add a Redis key following the
  existing pattern (`visitors:<resource>:{code}`).

---

## Adding a New Module

If you are adding a new resource type (not just extending an existing one):

1. Create `apps/api/src/modules/<name>/` with these five files:
   `controller.js`, `service.js`, `repository.js`, `schema.js`, `routes.js`
2. Register the routes in `app.js`.
3. Create the matching frontend feature at `apps/web/src/features/<name>/` with a
   component and a `<name>.api.js` file.
4. Document any new Redis keys in `docs/ARCHITECTURE.md`.
5. If the module has scaling implications, update `docs/SCALING_RULES.md`.

---

## Environment Variables

Never commit real values. Use `.env.example` as the template — add any new variable there
with a descriptive comment and an empty value. If a variable is required for the app to
start, note that clearly in the comment.

---

## Running Tests and Linting

```bash
# Lint
npm run lint

# Tests (check apps/api/package.json for the current test script)
cd apps/api && npm test
```

The CI pipeline runs linting and security checks on every pull request. A PR with lint
errors will not be merged.

---

## Submitting a Pull Request

1. Fork the repo and create a branch from `main`.
2. Name your branch descriptively: `feat/burn-after-read-files`, `fix/redis-fallback-url`.
3. Keep your PR focused — one concern per PR. A PR that adds a feature and refactors
   unrelated code will be asked to split.
4. Write a clear PR description: what the change does, why it is needed, and how to test it.
5. If your change affects the architecture, caching strategy, or scaling path, update the
   relevant doc in `docs/`.
6. All CI checks must pass before review.

### Commit message convention

Follow the existing style in the repo:

```
feat(url): add custom expiry validation in service layer
fix(redis): handle connection timeout without crashing
chore: update .env.example with new ADMIN_SECRET note
docs: document HyperLogLog fallback in SCALING_RULES
```

Format: `type(scope): short description`
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

---

## What to Work On

Check the [Issues](https://github.com/ivengexnce/NextShare/issues) tab for open tasks.
Good first issues are labelled accordingly. If you want to work on something not listed,
open an issue first and describe what you are planning — this avoids duplicate effort.

Areas that are always welcome:

- Test coverage for the service and repository layers
- Accessibility improvements in the frontend
- Documentation corrections or gaps
- Performance improvements that follow the existing caching strategy
- Bug fixes with a clear reproduction case

---

## What Not to Do

- Do not introduce new state management libraries or HTTP clients without opening an
  issue first.
- Do not bypass the layered architecture, even for a "simple" shortcut.
- Do not add `require()` to any frontend file.
- Do not commit `.env` files or any file containing real credentials.
- Do not change the `admin` module's direct-DB access pattern — it is intentional and
  documented.

---

If something in this document is unclear or out of date, open an issue or a PR to fix it.
