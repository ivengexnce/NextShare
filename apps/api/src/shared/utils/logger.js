const { createLogger, format, transports } = require('winston');
const config = require('../../config');

// ─── Format ────────────────────────────────────────────────────────────────────
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extra}`;
  }),
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

// ─── Logger Instance ───────────────────────────────────────────────────────────
const logger = createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: config.isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    // Scaling rule: add a File transport in prod or wire to a log aggregator (Datadog, Loki)
    ...(config.isDev
      ? []
      : [new transports.File({ filename: 'logs/error.log', level: 'error' })]),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
