const { createClient } = require('redis');
const config = require('./index');
const logger = require('../shared/utils/logger');

// ─── Client Singleton ──────────────────────────────────────────────────────────
// One shared client — never create per-request clients (connection pool exhaustion)
const client = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3 && config.isDev) {
        return false;
      }
      return Math.min(retries * 500, 3000);
    },
  },
});

client.on('error', (err) => {
  if (config.isDev && !client.isOpen) {
    logger.warn('[redis] Redis unavailable (cache disabled)', { error: err.message });
  } else {
    logger.error('[redis] Client error', { error: err.message });
  }
});
client.on('connect', () => logger.info('[redis] Connected'));
client.on('reconnecting', () => logger.warn('[redis] Reconnecting…'));

async function connect() {
  try {
    await client.connect();
  } catch (err) {
    logger.warn('[redis] Failed to connect to Redis — running without cache', {
      url: config.redis.url,
      error: err.message,
    });
  }
}

async function disconnect() {
  try {
    if (client.isOpen) {
      await client.quit();
      logger.info('[redis] Connection closed');
    }
  } catch (err) {
    logger.warn('[redis] Error during disconnect', { error: err.message });
  }
}

// ─── Helpers (used throughout services) ───────────────────────────────────────
// All helpers fail silently — Redis is a cache layer; a miss must never crash the app

async function get(key) {
  try {
    if (!client.isOpen) return null;
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn('[redis] get failed', { key, error: err.message });
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  try {
    if (!client.isOpen) return;
    const opts = ttlSeconds ? { EX: ttlSeconds } : {};
    await client.set(key, JSON.stringify(value), opts);
  } catch (err) {
    logger.warn('[redis] set failed', { key, error: err.message });
  }
}

async function del(key) {
  try {
    if (!client.isOpen) return;
    await client.del(key);
  } catch (err) {
    logger.warn('[redis] del failed', { key, error: err.message });
  }
}

async function incr(key) {
  try {
    if (!client.isOpen) return null;
    return await client.incr(key);
  } catch (err) {
    logger.warn('[redis] incr failed', { key, error: err.message });
    return null;
  }
}

module.exports = { client, connect, disconnect, get, set, del, incr };
