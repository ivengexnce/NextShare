const app = require('./app');
const config = require('./config');
const logger = require('./shared/utils/logger');
const db = require('./config/database');
const redis = require('./config/redis');

let server;

// ─── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    logger.info('[server] Starting NexusToolkit API…');

    // Connect data stores first — fail fast if they're unreachable
    await db.connect();
    await redis.connect();

    server = app.listen(config.port, () => {
      logger.info(`[server] Listening on port ${config.port} (${config.env})`);
      logger.info(`[server] Health: http://localhost:${config.port}/health`);
    });

    server.on('error', (err) => {
      logger.error('[server] HTTP server error', { error: err.message });
      shutdown(1);
    });
  } catch (err) {
    logger.error('[server] Failed to start', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
// Anti-breaking rule: always drain in-flight requests before closing connections.
// Kubernetes sends SIGTERM 30s before SIGKILL — we must finish within that window.
async function shutdown(code = 0) {
  logger.info('[server] Shutting down gracefully…');
  if (server) {
    server.close(async () => {
      try {
        await db.disconnect();
        await redis.disconnect();
        logger.info('[server] Shutdown complete');
        process.exit(code);
      } catch (err) {
        logger.error('[server] Error during shutdown', { error: err.message });
        process.exit(1);
      }
    });

    // Force exit after 15 seconds if drain hangs
    setTimeout(() => {
      logger.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 15_000).unref();
  } else {
    process.exit(code);
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT',  () => shutdown(0));

// Catch unhandled errors as a last resort
process.on('unhandledRejection', (reason) => {
  logger.error('[server] Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('[server] Uncaught exception', { error: err.message, stack: err.stack });
  shutdown(1);
});

start();
