/**
 * ResponseFactory — every API response goes through one of these methods.
 *
 * ANTI-PATTERN:  res.status(200).json({ data, ok: true })
 * CORRECT:       ResponseFactory.success(res, data, 'Created', 201)
 *
 * Consistent envelope lets the frontend switch on `success` once,
 * and the AI system prompt enforces it as a module boundary rule.
 */
const ResponseFactory = {
  /**
   * @param {Response} res
   * @param {any}      data
   * @param {string}   [message]
   * @param {number}   [statusCode=200]
   */
  success(res, data, message = 'OK', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * @param {Response} res
   * @param {AppError} error
   */
  error(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'INTERNAL_ERROR',
      message: error.isOperational ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  },

  /** Convenience — redirect with click tracking pre-registered */
  redirect(res, url) {
    return res.redirect(301, url);
  },
};

module.exports = ResponseFactory;
