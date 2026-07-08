<div align="center">

# 🔗 NextShare

**URL Shortening · File Sharing · Code Paste — one toolkit, offline-ready.**

[![Live App](https://img.shields.io/badge/Live-nextsharebymeet.vercel.app-00FFB3?style=for-the-badge&labelColor=0d1117)](https://nextsharebymeet.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge&labelColor=0d1117)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge&labelColor=0d1117)](#contributing)

</div>

---

## What is NextShare?

NextShare (internal codename **NexusToolkit**) is a full-stack developer utility platform combining three tools behind one clean UI:

- **URL Shortener** — short links with redirect analytics
- **File Sharing** — upload & share files with download tracking
- **Code / Text Paste** — shareable snippets, including burn-after-read

It ships as a **PWA** with IndexedDB-backed offline support and background sync, plus a secret-gated **admin analytics dashboard** for owner-only insight into traffic.

---

## ✨ Features

| | |
|---|---|
| 🔗 | Short links with Redis-cached redirects |
| 📁 | File uploads with download-count tracking |
| 📝 | Code/text pastes, including single-view burn-after-read |
| 📊 | Owner-only admin dashboard (Chart.js visualizations) |
| 📡 | Unique-visitor analytics via Redis Sets (per-URL, per-paste, per-file, global) |
| 📴 | Full offline support — PWA + IndexedDB + background sync |
| 📱 | Fully responsive, six breakpoints, hamburger nav, motion-preference aware |

---

## 🏗️ Architecture

```
HTTP Request
     │
     ▼
Controller        ← HTTP only (req, res). No business logic.
     │
     ▼
Service           ← business logic. Never touches req/res.
     │
     ▼
Repository        ← DB operations only.
     │
     ▼
Schema / Model    ← data shape.
```

Each feature module (`url`, `files`, `text`) follows this 5-file pattern strictly, with one deliberate exception: the **admin** module is read-only and talks to Mongoose/Redis directly, skipping service/repository layers by design.

Modules never import from each other directly — shared logic lives in `shared/`.

---

## 🧱 Tech Stack

| Layer      | Tech                                                        |
|------------|--------------------------------------------------------------|
| Frontend   | React 18, Vite 4, Zustand, idb (IndexedDB)                   |
| Backend    | Node.js 20, Express 4, Mongoose 7, Redis 4                    |
| Storage    | MongoDB 7, Redis 7, local filesystem (`/uploads`)             |
| Analytics  | Redis Sets for unique-visitor deduplication                   |
| Deploy     | Backend → Render · Frontend → Vercel                          |

---

## 🚀 Live URLs

| | |
|---|---|
| Landing page | [`nextsharebymeet.vercel.app/`](https://nextsharebymeet.vercel.app/) |
| App | `nextsharebymeet.vercel.app/app` |
| API | Render (see `VITE_API_URL`) |

---

## ⚡ Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or hosted)

### Install

```bash
git clone https://github.com/ivengexnce/NextShare.git
cd NextShare
npm install
```

### Environment

Copy `.env.example` to `.env` in the API app and fill in:

```
MONGODB_URI=
REDIS_URL=
BASE_URL=
FRONTEND_URL=
ADMIN_SECRET=
```

### Run

```bash
# API
cd apps/api && npm run dev

# Frontend
cd apps/web && npm run dev
```

### Docker

A `docker/` setup is included for containerized local development (API + Redis + Mongo).

```bash
docker compose up
```

---

## 📊 Redis Key Schema

| Key                     | Type | Contents                       |
|-------------------------|------|---------------------------------|
| `visitors:global`       | Set  | All unique IPs ever seen        |
| `visitors:url:{code}`   | Set  | Unique IPs that clicked a link  |
| `visitors:paste:{code}` | Set  | Unique IPs that viewed a paste  |
| `visitors:file:{code}`  | Set  | Unique IPs that downloaded      |
| `url:redirect:{code}`   | Str  | Cached redirect target + expiry |
| `url:stats:{code}`      | Str  | Cached URL analytics            |
| `paste:{code}`          | Str  | Cached paste content            |

**The one rule:** Redis is for speed, MongoDB is for truth. Writes always hit MongoDB first; Redis is cache-aside. Burn-after-read pastes bypass cache entirely.

---

## 📈 Scaling Notes

Current stage handles <10k req/day comfortably on a single Render instance + Vercel frontend. As traffic grows:

- Hot endpoints get Redis cache-aside (>100 req/min)
- File uploads move to an async queue (Bull) past 20/min
- Visitor Sets switch to HyperLogLog only if memory forces it
- Horizontal scaling requires migrating local file storage to S3 first

Full decision tree lives in the project's internal scaling docs.

---

## 🗂️ Project Structure

```
NextShare/
├── apps/
│   ├── api/      # Express backend (controllers, services, repositories)
│   └── web/      # React frontend (Vite, Zustand, IndexedDB)
├── docker/       # Local dev containers
├── docs/         # Architecture & internal docs
├── .env.example
└── LICENSE
```

---

## 🤝 Contributing

Issues and PRs welcome. Please follow the existing layer-boundary conventions (controller → service → repository → schema) and keep the frontend ESM-only (no `require()` — it causes a blank screen on Vercel).

---

## 📄 License

MIT © [Meet Maru](https://github.com/ivengexnce)
