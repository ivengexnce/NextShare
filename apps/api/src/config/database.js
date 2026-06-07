const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../shared/utils/logger');

// ─── Connection Options ────────────────────────────────────────────────────────
const OPTS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

// ─── Retry Logic ───────────────────────────────────────────────────────────────
// Scaling rule: wrap connection in retry so a slow DB start doesn't kill the pod
let retries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connect() {
  try {
    await mongoose.connect(config.mongodb.uri, OPTS);
    retries = 0;
    logger.info('[db] MongoDB connected', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@') });
  } catch (err) {
    retries += 1;
    logger.error('[db] MongoDB connection failed', { attempt: retries, error: err.message });

    if (retries >= MAX_RETRIES) {
      logger.error('[db] Max retries reached — exiting');
      process.exit(1);
    }

    logger.info(`[db] Retrying in ${RETRY_DELAY_MS / 1000}s…`);
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return connect();
  }
}

// ─── Event Hooks ───────────────────────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  logger.warn('[db] MongoDB disconnected — attempting reconnect');
  connect();
});

mongoose.connection.on('error', (err) => {
  logger.error('[db] MongoDB error', { error: err.message });
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
async function disconnect() {
  await mongoose.connection.close();
  logger.info('[db] MongoDB connection closed');
}

module.exports = { connect, disconnect };
