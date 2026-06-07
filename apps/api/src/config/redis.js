const { createClient } = require('redis');
const config = require('./index');
const logger = require('../shared/utils/logger');

// ─── Client Singleton ──────────────────────────────────────────────────────────
// One shared client — never create per-request clients (connection pool exhaustion)
const client = createClient({ url: config.redis.url });

client.on('error', (err) => logger.error('[redis] Client error', { error: err.message }));
client.on('connect', () => logger.info('[redis] Connected'));
client.on('reconnecting', () => logger.warn('[redis] Reconnecting…'));

async function connect() {
  await client.connect();
}

async function disconnect() {
  await client.quit();
  logger.info('[redis] Connection closed');
}

// ─── Helpers (used throughout services) ───────────────────────────────────────
// All helpers fail silently — Redis is a cache layer; a miss must never crash the app

async function get(key) {
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn('[redis] get failed', { key, error: err.message });
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  try {
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await client.set(key, JSON.stringify(value), opts);
  } catch (err) {
    logger.warn('[redis] set failed', { key, error: err.message });
  }
}

async function del(key) {
  try {
    await client.del(key);
  } catch (err) {
    logger.warn('[redis] del failed', { key, error: err.message });
  }
}

async function incr(key) {
  try {
    return await client.incr(key);
  } catch (err) {
    logger.warn('[redis] incr failed', { key, error: err.message });
    return null;
  }
}

module.exports = { client, connect, disconnect, get, set, del, incr };
