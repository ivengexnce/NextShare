# NextShare — Scaling Rules

A concrete decision tree. At each threshold, the rule tells you exactly
what to change and where. No guessing, no premature optimization.

---

## Stage 0 — Single Node (current state)

**Traffic target:** < 10k requests/day, < 100 concurrent users
**Infrastructure:** Render (API) + Vercel (frontend) + MongoDB Atlas + Redis

Nothing to change. Current architecture handles this comfortably.

Current Redis usage:
- Strings: URL redirect cache, stats cache, paste cache
- Sets: visitors:global, visitors:url:*, visitors:paste:*, visitors:file:*

All visitor Sets grow forever (no TTL). At this stage, total Set memory is negligible.

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
**Where:** Add TTL constant to config/index.js under cache:
**Rule:** Never hardcode TTL. Always reference config.cache.*

### Rule 1.2 — File uploads > 20/min → move to async queue

**Signal:** Upload endpoint P95 latency > 2s, CPU spikes during uploads
**Action:**
1. Install Bull: `npm install bull`
2. Create `apps/api/src/shared/queues/upload.queue.js`
3. Controller enqueues job → returns 202 Accepted
4. Worker processes file in background
5. WebSocket or polling to notify client when done

### Rule 1.3 — Click tracking causing write contention

**Signal:** MongoDB write locks, slow redirects
**Current state:** clicks field updated via setImmediate (non-blocking) per redirect
**Action if still a bottleneck:**
```js
// Replace synchronous increment with Redis counter
await redis.incr(`url:clicks:${code}`);

// Cron job every 5 min flushes Redis counters → MongoDB
// apps/api/src/shared/jobs/flushClicks.job.js
```

### Rule 1.4 — Visitor Set memory growing

**Signal:** Redis memory > 100 MB, most of it in visitors:* Sets
**Context:** Each IP is ~15 bytes in a Set. 100k unique IPs ≈ 1.5 MB per Set.
**Action:** Monitor with `redis-cli MEMORY USAGE visitors:global`
If memory is acceptable, do nothing — Sets are efficient for this.
If Sets are too large (millions of entries), switch to HyperLogLog:
```js
// HyperLogLog uses ~12 KB regardless of cardinality — loses exact membership
await client.pfAdd('visitors:global', ip);
const approxCount = await client.pfCount('visitors:global');
```
Note: HyperLogLog cannot answer "has IP X visited?" — only "how many unique IPs?"
Only switch if memory forces it.

### Rule 1.5 — Admin stats endpoint too slow

**Signal:** /admin/stats takes > 2s, times out
**Current state:** Fetches up to 1000 docs per collection + sCard per document (N+1)
**Action:**
```js
// Pre-aggregate counts in a background job rather than on demand
// Store totals in Redis hash for instant retrieval
await client.hSet('admin:stats:totals', {
    urls: urlCount,
    pastes: pasteCount,
    files: fileCount,
    globalVisitors: visitorCount,
    updatedAt: Date.now(),
});
```
Run the aggregation job every 5 minutes. /admin/stats reads from the hash.

### Rule 1.6 — Log volume too high

**Signal:** Disk filling, log search slow
**Action:** Add structured log shipping
```js
// In logger.js, add transport:
new transports.Http({ host: 'loki-host', path: '/loki/api/v1/push' })
```

---

## Stage 2 — Scale-Out (100k–1M req/day)

### Rule 2.1 — Multiple API instances

**Signal:** Single Render instance CPU > 70% sustained
**Action:**
1. API is already stateless — scale horizontally
2. Add load balancer
3. UPLOAD_DIR must point to shared storage (NFS or S3) — not local disk
4. visitor.middleware.js uses a single Redis client — this is safe across instances
5. No sticky sessions needed (all shared state is in Redis)

**Critical:** File uploads go to local disk currently. Must migrate to S3 before
horizontal scaling. Otherwise Instance A's files are invisible to Instance B.

### Rule 2.2 — visitor:* Sets become a bottleneck

**Signal:** sAdd latency climbing, Redis CPU high from Set operations
**Action options (in order):**
1. Pipeline multiple sAdd calls in one round-trip (batching)
2. Switch global tracking from Set to HyperLogLog (drops exact membership)
3. Move visitor tracking to a write-behind queue (accept eventual consistency)
4. Use Redis Cluster to shard the Sets across nodes

### Rule 2.3 — MongoDB reads becoming a bottleneck

**Signal:** MongoDB CPU > 60%, read latency > 20ms P95
**Action in order:**
1. Verify indexes are being used: `db.collection.explain('executionStats')`
2. Add a MongoDB read replica and route reads to it
3. Increase Redis TTLs to reduce DB read frequency
4. Use field projection: `.lean().select('field1 field2')`

### Rule 2.4 — Redis memory pressure

**Signal:** Redis memory > 200 MB, evictions rising
**Action:**
1. Docker config sets `maxmemory 256mb --maxmemory-policy allkeys-lru`
   LRU eviction means cache misses, not crashes
2. Visitor Sets are excluded from LRU if you add a `noevict` prefix policy
3. If memory still insufficient: increase maxmemory or move to Redis Cluster

### Rule 2.5 — Rate limiting insufficient

**Signal:** Malicious traffic pattern, rate limiter at capacity
**Action:**
1. Move rate limiting to load balancer layer (Nginx limit_req_zone)
2. Add Cloudflare in front (free plan handles most DDoS)
3. Implement IP allowlisting for /admin routes

### Rule 2.6 — File storage outgrowing local disk

**Signal:** Disk usage > 70% or need multi-instance uploads
**Action:**
1. Add S3-compatible storage (AWS S3, Cloudflare R2, MinIO)
2. Change files.service.js to use @aws-sdk/client-s3
3. Store S3 key in storedName field instead of filename
4. Repository interface unchanged — only service changes

---

## Stage 3 — High Scale (1M+ req/day)

At this point dedicated infrastructure investment is required.

| Concern             | Solution                                       |
|---------------------|------------------------------------------------|
| URL redirect speed  | Move to edge workers (Cloudflare Workers)      |
| DB write scale      | MongoDB sharding on shortCode                  |
| Cache scale         | Redis Cluster, dedicated instance per service  |
| Visitor tracking    | Dedicated analytics service (ClickHouse etc.)  |
| File delivery       | CDN with S3 origin (CloudFront, Cloudflare)    |
| Job processing      | Dedicated Bull worker pods (Kubernetes)        |
| Observability       | OpenTelemetry traces, Grafana dashboard        |
| Admin stats         | Pre-aggregated OLAP queries, not live MongoDB  |

---

## Rate Limit Tuning Reference

Current limits are in shared/middleware/rateLimit.middleware.js.
Tune based on real traffic data, not guesses.

| Limiter              | Default   | When to tighten | When to loosen  |
|----------------------|-----------|-----------------|-----------------|
| urlCreateLimiter     | 30/15min  | Spam detected   | Logged-in users |
| urlRedirectLimiter   | 300/15min | Bot scraping    | CDN handles it  |
| fileUploadLimiter    | 10/15min  | Storage cost    | Paid tier       |
| fileDownloadLimiter  | 100/15min | Bandwidth cost  | CDN handles it  |
| pasteCreateLimiter   | 50/15min  | Spam detected   | API customers   |
| generalLimiter       | 100/15min | Abuse pattern   | Trusted partners|

---

## Database Index Rules

Every query on a hot path must have an index.
Before adding a new query, run explain('executionStats') and confirm
COLLSCAN does not appear.

**Indexes already present:**
- shortCode — unique, all three modules (primary lookup)
- isActive + createdAt — list endpoints
- expiresAt — TTL index (MongoDB auto-deletes)

**Rule for new indexes:**
1. Write the query first
2. Run explain() to see the scan plan
3. Add the minimum index that satisfies it
4. Compound index field order: equality first, range second, sort last

---

## The One Rule That Prevents 80% of Scaling Problems

> Redis is for speed. MongoDB is for truth.
>
> Never write only to Redis. Always write to MongoDB first.
> Never read only from MongoDB on a hot path. Always check Redis first.
> If Redis is down, the app must still work (slower, but correctly).
>
> Exception: visitor tracking Sets are Redis-only. If Redis is down,
> visitor counts are temporarily inaccurate — this is acceptable.
> Real content (URLs, pastes, files) always has MongoDB as source of truth.