const AppError = require('../errors/AppError');
const ErrorCodes = require('../errors/errorCodes');
const ResponseFactory = require('../utils/response.factory');
const logger = require('../utils/logger');
const config = require('../../config');

const SENSITIVE_KEYS = ['password', 'secret', 'adminsecret', 'token', 'authorization', 'cookie'];

/**
 * Redact sensitive fields before writing to logs.
 */
function sanitizeForLogs(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLogs);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogs(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Error Middleware — must be registered LAST in app.js (4 params = error handler).
 *
 * Classifies errors into two buckets:
 *  1. Operational (AppError) — expected, safe message sent to client.
 *  2. Unexpected              — internal bug, generic message + full log with redacted secrets.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, _next) {
  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join('; ');
    return ResponseFactory.error(
      res,
      new AppError(messages, ErrorCodes.VALIDATION_ERROR, 400),
    );
  }

  // ── Mongoose Duplicate Key ────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return ResponseFactory.error(
      res,
      new AppError(`Duplicate value for: ${field}`, ErrorCodes.CODE_TAKEN, 409),
    );
  }

  // ── Multer / File Errors ──────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ResponseFactory.error(
      res,
      new AppError('File exceeds the maximum allowed size', ErrorCodes.FILE_TOO_LARGE, 413),
    );
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ResponseFactory.error(
      res,
      new AppError('Invalid or expired token', ErrorCodes.UNAUTHORIZED, 401),
    );
  }

  // ── Known Operational Error ───────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    logger.warn('[error] Operational error', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });
    return ResponseFactory.error(res, err);
  }

  // ── Unexpected / Programming Error ────────────────────────────────────────
  logger.error('[error] Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: sanitizeForLogs(req.body),
  });

  const devMessage = config.isDev ? `${err.message || 'Error'} [${err.name || 'Error'}]` : 'An unexpected error occurred';
  return ResponseFactory.error(
    res,
    new AppError(devMessage, ErrorCodes.INTERNAL_ERROR, 500, { stack: config.isDev ? err.stack : undefined }),
  );
}

module.exports = errorMiddleware;
