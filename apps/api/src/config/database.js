const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../shared/utils/logger');

// ─── Connection Options ────────────────────────────────────────────────────────
const OPTS = {
  serverSelectionTimeoutMS: 3000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

let retries = 0;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
let isInitialConnected = false;
let memoryServer = null;

async function startInMemoryServer() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  logger.info('[db] Initializing in-memory MongoDB server for development…');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri, OPTS);
  isInitialConnected = true;
  logger.info('[db] Connected to in-memory MongoDB server', { uri });
}

async function connect() {
  try {
    await mongoose.connect(config.mongodb.uri, OPTS);
    retries = 0;
    isInitialConnected = true;
    logger.info('[db] MongoDB connected', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@') });
  } catch (err) {
    retries += 1;
    logger.warn('[db] MongoDB connection attempt failed', { attempt: retries, maxRetries: MAX_RETRIES, error: err.message });
    await mongoose.disconnect().catch(() => {});

    // In development mode, if local MongoDB is unreachable, start an in-memory instance
    if (config.isDev && retries >= MAX_RETRIES) {
      logger.info('[db] Local MongoDB unreachable. Starting in-memory MongoDB fallback…');
      try {
        await startInMemoryServer();
        return;
      } catch (memErr) {
        logger.error('[db] Could not start in-memory MongoDB fallback', { error: memErr.message });
      }
    }

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
  if (isInitialConnected && !memoryServer) {
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
  if (memoryServer) {
    await memoryServer.stop();
    logger.info('[db] In-memory MongoDB stopped');
  }
  logger.info('[db] MongoDB connection closed');
}

module.exports = { connect, disconnect };
