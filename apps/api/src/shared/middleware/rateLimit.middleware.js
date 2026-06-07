const rateLimit = require('express-rate-limit');
const ErrorCodes = require('../errors/errorCodes');

/**
 * rateLimiter — factory that creates a pre-configured rate limiter.
 *
 * Scaling rule: every public endpoint gets its own limiter.
 * Tighten limits as traffic grows; never share one limiter across all routes.
 */
function rateLimiter(max, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        code: ErrorCodes.RATE_LIMITED,
        message: 'Too many requests — please slow down',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
}

// ─── Named Limiters ────────────────────────────────────────────────────────────
// Lower = more restrictive. Tune as you gather real traffic data.

/** URL creation — 30 per 15 min per IP */
const urlCreateLimiter = rateLimiter(30);

/** URL redirect — 300 per 15 min per IP (read-heavy) */
const urlRedirectLimiter = rateLimiter(300);

/** File upload — 10 per 15 min per IP (write-heavy, bandwidth cost) */
const fileUploadLimiter = rateLimiter(10);

/** File download — 100 per 15 min per IP */
const fileDownloadLimiter = rateLimiter(100);

/** Paste create — 50 per 15 min per IP */
const pasteCreateLimiter = rateLimiter(50);

/** General API — fallback for unlisted routes */
const generalLimiter = rateLimiter(100);

module.exports = {
  urlCreateLimiter,
  urlRedirectLimiter,
  fileUploadLimiter,
  fileDownloadLimiter,
  pasteCreateLimiter,
  generalLimiter,
};
