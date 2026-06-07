/**
 * AppError — every thrown error in the app must be an instance of this.
 *
 * ANTI-PATTERN:  throw new Error('Not found')
 * CORRECT:       throw new AppError('Not found', 'NOT_FOUND', 404)
 *
 * The error middleware checks `err instanceof AppError` to decide whether
 * to expose the message to clients or return a generic 500.
 */
class AppError extends Error {
  /**
   * @param {string}  message     Human-readable message (may be sent to client)
   * @param {string}  code        Machine-readable code from errorCodes.js
   * @param {number}  statusCode  HTTP status (default 500)
   * @param {object}  [meta]      Extra data for logging (never sent to client)
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, meta = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
    this.isOperational = true; // operational = expected, safe to expose

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
    };
  }
}

module.exports = AppError;
