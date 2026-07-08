<div align="center">

# 🔗 NextShare — Open Source URL Shortener, File Sharing & Code Paste Tool

**Free & Open Source Alternative to Bitly, WeTransfer, and Pastebin — Built with React, Node.js, MongoDB & Redis**

A full-stack, offline-capable link shortener, file-sharing, and code/text paste platform with real-time analytics and an admin dashboard. Built for developers who want a self-hostable, privacy-respecting alternative to closed-source SaaS tools.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nextsharebymeet.vercel.app-00FFB3?style=for-the-badge&labelColor=0d1117)](https://nextsharebymeet.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge&labelColor=0d1117)](LICENSE)
[![Made with React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react&labelColor=0d1117)](https://react.dev)
[![Made with Node](https://img.shields.io/badge/Backend-Node.js_20-339933?style=for-the-badge&logo=nodedotjs&labelColor=0d1117)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge&labelColor=0d1117)](#contributing)
[![Stars](https://img.shields.io/github/stars/ivengexnce/NextShare?style=for-the-badge&color=00FFB3&labelColor=0d1117)](https://github.com/ivengexnce/NextShare/stargazers)

**Keywords:** url shortener open source · self hosted link shortener · file sharing app react node · code paste tool · pastebin alternative · bitly alternative · PWA offline file share · MERN stack developer tool · full stack portfolio project

</div>

---

## 📌 Why NextShare?

Most link-shortener and file-sharing tools are closed-source SaaS products with paywalls, tracking, or vendor lock-in. **NextShare** is a fully open-source, self-hostable alternative that gives developers and teams:

- 🆓 Zero licensing cost — MIT licensed, run it anywhere
- 🔐 Full data ownership — your links, files, and pastes stay on your infrastructure
- 📴 Works offline — installable PWA with background sync
- 🧱 Production-grade architecture — layered backend (controller/service/repository), not a weekend script

If you're evaluating **URL shortener open source projects**, **self-hosted file sharing tools**, or **Pastebin/Bitly alternatives** for a portfolio review, technical interview, or real deployment — this repo is built to be read, extended, and scaled.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 **URL Shortener** | Custom short links, Redis-cached redirects, click analytics |
| 📁 **File Sharing** | Secure uploads, expiring links, download-count tracking |
| 📝 **Code / Text Paste** | Shareable snippets with syntax support + burn-after-read mode |
| 📊 **Admin Analytics Dashboard** | Owner-only, secret-gated, Chart.js visualizations of traffic |
| 📡 **Unique Visitor Tracking** | Redis Set-based deduplication — accurate, low-overhead analytics |
| 📴 **Offline-First PWA** | IndexedDB caching + background sync, installable on any device |
| 📱 **Fully Responsive UI** | Six breakpoints, hamburger nav, reduced-motion support |
| ⚙️ **Scalable Architecture** | Cache-aside Redis layer, MongoDB source of truth, horizontal-scaling-ready |

---

## 🖥️ Live Demo

| | |
|---|---|
| 🌐 Landing Page | [nextsharebymeet.vercel.app](https://nextsharebymeet.vercel.app/) |
| 🧰 App | `nextsharebymeet.vercel.app/app` |
| ⚙️ API | Hosted on Render |

---

## 🏗️ Architecture Overview

```
HTTP Request
     │
     ▼
Controller        ← HTTP only. No business logic.
     │
     ▼
Service           ← Business logic. Never touches req/res.
     │
     ▼
Repository        ← Database operations only.
     │
     ▼
Schema / Model    ← Data shape (Mongoose).
```

Strict layer separation across `url`, `files`, and `text` modules. The `admin` module is a deliberate, documented exception — read-only, talking to MongoDB/Redis directly.

---

## 🧱 Tech Stack

| Layer      | Technology                                                       |
|------------|-------------------------------------------------------------------|
| Frontend   | React 18 · Vite 4 · Zustand · IndexedDB (idb)                    |
| Backend    | Node.js 20 · Express 4 · Mongoose 7 · Redis 4                    |
| Database   | MongoDB 7                                                          |
| Cache      | Redis 7 (cache-aside pattern)                                     |
| Deployment | Render (API) · Vercel (Frontend)                                  |
| PWA        | Service Workers · Background Sync · Offline Queue                 |

**Searchable stack tags:** `react` `nodejs` `expressjs` `mongodb` `redis` `vite` `zustand` `pwa` `javascript` `full-stack` `rest-api` `mern-stack`

---

## ⚡ Quick Start

\`\`\`bash
git clone https://github.com/ivengexnce/NextShare.git
cd NextShare
npm install
\`\`\`

**Configure environment** — copy \`.env.example\` → \`.env\`:

\`\`\`
MONGODB_URI=
REDIS_URL=
BASE_URL=
FRONTEND_URL=
ADMIN_SECRET=
\`\`\`

**Run locally:**

\`\`\`bash
cd apps/api && npm run dev     # backend
cd apps/web && npm run dev     # frontend
\`\`\`

**Or with Docker:**

\`\`\`bash
docker compose up
\`\`\`

---

## 📊 How Analytics Work

Unique visitors are tracked via Redis Sets (not simple counters), giving automatic, memory-efficient deduplication:

| Redis Key | Purpose |
|---|---|
| \`visitors:global\` | All unique visitors site-wide |
| \`visitors:url:{code}\` | Unique clicks per short link |
| \`visitors:paste:{code}\` | Unique views per paste |
| \`visitors:file:{code}\` | Unique downloads per file |

**Core rule:** MongoDB is the source of truth; Redis is a speed layer. If Redis goes down, the app still works correctly — just slower.

---

## 📈 Built to Scale

NextShare ships with a documented scaling path — not just a demo:

- Cache-aside Redis on any endpoint exceeding 100 req/min
- Async upload queue (Bull) past 20 uploads/min
- Horizontal API scaling with stateless design (shared Redis, no sticky sessions)
- S3-ready file storage migration path for multi-instance deployments
- HyperLogLog fallback for visitor tracking at massive scale

---

## 🗂️ Project Structure

\`\`\`
NextShare/
├── apps/
│   ├── api/      # Express backend — controllers, services, repositories
│   └── web/      # React frontend — Vite, Zustand, IndexedDB
├── docker/       # Local development containers
├── docs/         # Architecture & scaling documentation
├── .env.example
└── LICENSE
\`\`\`

---

## ❓ FAQ

**Is NextShare free to use?**
Yes — it's MIT licensed and free to self-host or fork.

**Can I use this as a Bitly or Pastebin replacement?**
Yes. NextShare covers URL shortening and paste sharing (with burn-after-read) in one self-hosted app, plus file sharing that neither Bitly nor Pastebin offer.

**Does it work offline?**
Yes — it's a PWA with IndexedDB caching and background sync for offline use.

**What makes this different from a typical student project?**
A documented layered architecture (controller/service/repository), Redis caching strategy, visitor analytics, and a written scaling plan from single-node to 1M+ requests/day.

**Can I deploy this myself?**
Yes — deploy the backend to Render (or any Node host) and the frontend to Vercel (or any static host). Docker Compose is included for local/dev parity.

---

## 🤝 Contributing

Issues and PRs are welcome. Please follow the existing layer-boundary conventions (controller → service → repository → schema) and keep the frontend ESM-only — no \`require()\`, it breaks the build on Vercel.

---

## 👤 Author

**Meet Maru** — AI & ML Engineer | Full-Stack Developer | Mumbai, India
Vice President, CSI VIVA · Front-End AI Engineering Intern @ FlyRank

[Portfolio](https://ivengexnce.github.io/portfolio/) · [LinkedIn](https://www.linkedin.com/in/meetmaru149/) · [GitHub](https://github.com/ivengexnce)

---

## 📄 License

MIT © [Meet Maru](https://github.com/ivengexnce) — free to use, modify, and self-host.

---

<div align="center">

⭐ **If NextShare is useful to you, star the repo — it helps others discover it.** ⭐

</div>
