# NexusToolkit — Scaling Rules

A concrete decision tree. At each threshold, the rule tells you exactly
what to change and where. No guessing, no premature optimization.

---

## Stage 0 — Single Node (current)

**Traffic target:** < 10k requests/day, < 100 concurrent users
**Infrastructure:** 1 server, MongoDB + Redis on same machine or cheap VPS

Nothing to change. The current architecture handles this easily.

---

## Stage 1 — Growing (10k–100k req/day)

### Rule 1.1 — Any endpoint > 100 req/min → add Redis cache

**Signal:** Response time climbing, MongoDB CPU spiking
**Action:**
```js
// In the service method, add cache-aside:
const cached = await redis.get(cacheKey(id));
if (cached) return cached;

const data = await Repository.findById(id);
await redis.set(cacheKey(id), data, TTL_SECONDS);
return data;
```
**Where:** `apps/api/src/config/index.js` → `cache:` section for new TTL key
**Rule:** Never hardcode TTL. Always reference `config.cache.*`.

### Rule 1.2 — File uploads > 20/min → move to async queue

**Signal:** Upload endpoint P95 latency > 2s, CPU spikes during uploads
**Action:**
1. Install Bull: `npm install bull`
2. Create `apps/api/src/shared/queues/upload.queue.js`
3. Controller enqueues job → returns 202 Accepted immediately
4. Worker processes file in background
5. Use WebSocket or polling to notify client when done

### Rule 1.3 — Click tracking causing write contention

**Signal:** MongoDB write locks, slow redirects
**Action:** Replace synchronous `incrementClicks` with Redis counter + periodic flush
```js
// Instead of DB write per click:
await redis.incr(`url:clicks:${code}`);

// Cron job every 5 min flushes Redis counters → MongoDB
// apps/api/src/shared/jobs/flushClicks.job.js
```

### Rule 1.4 — Log volume too high

**Signal:** Disk filling, log search slow
**Action:** Add structured log shipping to Loki or Datadog
```js
// In logger.js, add transport:
new transports.Http({ host: 'loki-host', path: '/loki/api/v1/push' })
```

---

## Stage 2 — Scale-Out (100k–1M req/day)

### Rule 2.1 — Multiple API instances

**Signal:** Single server CPU > 70% sustained
**Action:**
1. API is already stateless (no in-memory session state) — just add instances
2. Put a load balancer (Nginx or HAProxy) in front
3. Ensure `UPLOAD_DIR` points to shared volume (NFS or S3) — not local disk
4. Sticky sessions not needed (Redis handles all shared state)

**Critical check:** File uploads must go to shared storage before scaling horizontally.
Local disk files are invisible to other instances.

### Rule 2.2 — MongoDB reads becoming a bottleneck

**Signal:** MongoDB CPU > 60%, read latency > 20ms P95
**Action in order:**
1. Add compound indexes for the exact queries being run (check `db.collection.explain()`)
2. Add a MongoDB read replica and route read queries to it
3. Increase Redis TTLs to reduce DB read frequency
4. Consider field projection (`.lean().select('field1 field2')`) to reduce document size

### Rule 2.3 — Redis memory pressure

**Signal:** Redis memory > 200 MB, evictions rising
**Action:**
1. The current Docker config sets `maxmemory 256mb --maxmemory-policy allkeys-lru`
   which is safe — LRU eviction means cache misses, not crashes
2. If misses are too high, increase `maxmemory` or reduce TTLs
3. If still not enough, move to Redis Cluster

### Rule 2.4 — Rate limiting not enough — DDoS protection needed

**Signal:** Malicious traffic pattern, rate limiter at capacity
**Action:**
1. Move rate limiting to the load balancer layer (Nginx `limit_req_zone`)
2. Add Cloudflare in front (free plan handles most DDoS)
3. Implement IP allowlisting for admin routes

### Rule 2.5 — File storage outgrowing local disk

**Signal:** Disk usage > 70%, or needing multi-instance uploads
**Action:**
1. Add S3-compatible storage (AWS S3, Cloudflare R2, MinIO)
2. Change `files.service.js` to use `@aws-sdk/client-s3` for upload/download
3. Store S3 key in `storedName` field instead of filename
4. Keep the repository interface unchanged — only service changes

---

## Stage 3 — High Scale (1M+ req/day)

At this point you need a dedicated DevOps/infrastructure decision. The codebase
is already structured to support these patterns but they require infrastructure
investment:

| Concern            | Solution                                      |
|--------------------|-----------------------------------------------|
| URL redirect speed | Move to edge workers (Cloudflare Workers)     |
| DB write scale     | MongoDB sharding on `shortCode`               |
| Cache scale        | Redis Cluster, dedicated instance per service |
| File delivery      | CDN with S3 origin (CloudFront, Cloudflare)   |
| Job processing     | Dedicated Bull worker pods (Kubernetes)       |
| Observability      | OpenTelemetry traces, Grafana dashboard       |

---

## Rate Limit Tuning Reference

Current limits are in `shared/middleware/rateLimit.middleware.js`.
Tune them based on real traffic data, not guesses.

| Limiter              | Default     | When to tighten | When to loosen   |
|----------------------|-------------|-----------------|------------------|
| `urlCreateLimiter`   | 30/15min    | Spam detected   | Logged-in users  |
| `urlRedirectLimiter` | 300/15min   | Bot scraping    | CDN handles it   |
| `fileUploadLimiter`  | 10/15min    | Storage cost    | Paid tier users  |
| `fileDownloadLimiter`| 100/15min   | Bandwidth cost  | CDN handles it   |
| `pasteCreateLimiter` | 50/15min    | Spam detected   | API customers    |
| `generalLimiter`     | 100/15min   | Abuse pattern   | Trusted partners |

**Rule:** Always measure before changing limits.
Use `X-RateLimit-Remaining` header in responses to monitor headroom.

---

## Database Index Rules

Every query that runs in a hot path must have an index.
Before adding a new query, run `explain('executionStats')` and confirm
`COLLSCAN` does not appear in the output.

**Indexes already present:**
- `shortCode` — unique, all three modules (primary lookup)
- `isActive + createdAt` — list endpoints
- `expiresAt` — TTL index (MongoDB auto-deletes)

**Rule for new indexes:**
1. Write the query first
2. Run `explain()` to see the scan plan
3. Add the minimum index that satisfies it
4. Compound index field order: equality first, range second, sort last

---

## The One Rule That Prevents 80% of Scaling Problems

> **Redis is for speed. MongoDB is for truth.**
>
> Never write only to Redis. Always write to MongoDB first.
> Never read only from MongoDB on a hot path. Always check Redis first.
> If Redis is down, the app must still work (slower, but correctly).
