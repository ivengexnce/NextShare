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
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
let isInitialConnected = false;

async function connect() {
  try {
    await mongoose.connect(config.mongodb.uri, OPTS);
    retries = 0;
    isInitialConnected = true;
    logger.info('[db] MongoDB connected', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@') });
  } catch (err) {
    retries += 1;
    logger.error('[db] MongoDB connection failed', { attempt: retries, maxRetries: MAX_RETRIES, error: err.message });
    await mongoose.disconnect().catch(() => {});

    if (retries >= MAX_RETRIES) {
      logger.error('[db] Max retries reached — could not connect to MongoDB.');
      logger.error(`[db] Target URI: ${config.mongodb.uri.replace(/\/\/.*@/, '//***@')}`);
      logger.error('[db] Please make sure a MongoDB server is running or provide a valid MONGODB_URI in .env (e.g., MongoDB Atlas cloud URI).');
      process.exit(1);
    }

    logger.info(`[db] Retrying in ${RETRY_DELAY_MS / 1000}s…`);
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return connect();
  }
}

// ─── Event Hooks ───────────────────────────────────────────────────────────────
// Only trigger reconnect on 'disconnected' AFTER an initial successful connection
mongoose.connection.on('disconnected', () => {
  if (isInitialConnected) {
    logger.warn('[db] MongoDB disconnected — attempting reconnect');
    isInitialConnected = false;
    connect().catch(() => {});
  }
});

mongoose.connection.on('error', (err) => {
  if (isInitialConnected) {
    logger.error('[db] MongoDB error', { error: err.message });
  }
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
async function disconnect() {
  isInitialConnected = false;
  await mongoose.connection.close();
  logger.info('[db] MongoDB connection closed');
}

module.exports = { connect, disconnect };
