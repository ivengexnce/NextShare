const AppError = require('../errors/AppError');
const ErrorCodes = require('../errors/errorCodes');
const ResponseFactory = require('../utils/response.factory');
const logger = require('../utils/logger');

/**
 * Error Middleware — must be registered LAST in app.js (4 params = error handler).
 *
 * Classifies errors into two buckets:
 *  1. Operational (AppError) — expected, safe message sent to client.
 *  2. Unexpected              — internal bug, generic message + full log.
 *
 * Anti-breaking rule: NEVER remove this or move it above routes.
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
    body: req.body,
  });

  return ResponseFactory.error(
    res,
    new AppError('An unexpected error occurred', ErrorCodes.INTERNAL_ERROR, 500),
  );
}

module.exports = errorMiddleware;
