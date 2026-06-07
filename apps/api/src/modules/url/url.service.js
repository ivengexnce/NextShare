const Joi = require('joi');
const AppError = require('../../shared/errors/AppError');
const ErrorCodes = require('../../shared/errors/errorCodes');
const redis = require('../../config/redis');
const config = require('../../config');
const { generateShortCode, validateCustomCode } = require('../../shared/utils/hash');
const UrlRepository = require('./url.repository');

// ─── Validation Schema ─────────────────────────────────────────────────────────
const shortenSchema = Joi.object({
  originalUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required()
    .messages({
      'string.uri': 'Please provide a valid URL starting with http:// or https://',
    }),
  customCode:  Joi.string().alphanum().min(3).max(20).optional(),
  title:       Joi.string().max(255).optional().allow(''),
  expiresIn:   Joi.number().integer().min(1).max(365).optional()
                  .description('Days until link expires'),
});

// ─── Cache Key Helpers ─────────────────────────────────────────────────────────
const cacheKey = {
  redirect: (code) => `url:redirect:${code}`,
  stats:    (code) => `url:stats:${code}`,
};

// ─── Service ───────────────────────────────────────────────────────────────────
const UrlService = {
  /**
   * Shorten a URL.
   * Returns { shortCode, shortUrl, originalUrl, expiresAt }
   */
  async shorten(payload, createdBy = 'anonymous') {
    // 1. Validate input
    const { error, value } = shortenSchema.validate(payload, { abortEarly: false });
    if (error) {
      throw new AppError(error.details.map((d) => d.message).join('; '), ErrorCodes.VALIDATION_ERROR, 400);
    }

    const { originalUrl, customCode, title, expiresIn } = value;

    // 2. Resolve short code
    let shortCode;
    if (customCode) {
      if (!validateCustomCode(customCode)) {
        throw new AppError('Custom code may only contain letters, numbers, and hyphens (3–20 chars)', ErrorCodes.VALIDATION_ERROR, 400);
      }
      const taken = await UrlRepository.codeExists(customCode);
      if (taken) {
        throw new AppError(`The code "${customCode}" is already taken`, ErrorCodes.CODE_TAKEN, 409);
      }
      shortCode = customCode;
    } else {
      // Generate unique code — retry up to 5 times on collision (astronomically rare)
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 5) {
          throw new AppError('Could not generate unique code', ErrorCodes.INTERNAL_ERROR, 500);
        }
      } while (await UrlRepository.codeExists(shortCode));
    }

    // 3. Compute expiry
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // 4. Persist
    const url = await UrlRepository.create({ shortCode, originalUrl, title, expiresAt, createdBy });

    // 5. Warm Redis cache immediately (avoids first-redirect DB hit)
    await redis.set(cacheKey.redirect(shortCode), { originalUrl, expiresAt }, config.cache.urlRedirectTtl);

    return {
      shortCode: url.shortCode,
      shortUrl: `${config.app.baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      title: url.title,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
    };
  },

  /**
   * Resolve a short code → original URL.
   * Increments click count non-blockingly.
   */
  async resolve(shortCode) {
    // 1. Cache-first (Scaling rule: hot path hits Redis, not Mongo)
    const cached = await redis.get(cacheKey.redirect(shortCode));
    if (cached) {
      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await redis.del(cacheKey.redirect(shortCode));
        throw new AppError('This link has expired', ErrorCodes.URL_EXPIRED, 410);
      }
      // Increment asynchronously — never block the redirect
      setImmediate(() => UrlRepository.incrementClicks(shortCode));
      return cached.originalUrl;
    }

    // 2. DB fallback
    const url = await UrlRepository.findByCode(shortCode);
    if (!url) throw new AppError('Short link not found', ErrorCodes.URL_NOT_FOUND, 404);

    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new AppError('This link has expired', ErrorCodes.URL_EXPIRED, 410);
    }

    // 3. Re-warm cache
    await redis.set(cacheKey.redirect(shortCode), { originalUrl: url.originalUrl, expiresAt: url.expiresAt }, config.cache.urlRedirectTtl);

    setImmediate(() => UrlRepository.incrementClicks(shortCode));
    return url.originalUrl;
  },

  /**
   * Get analytics stats for a short code.
   */
  async getStats(shortCode) {
    const cached = await redis.get(cacheKey.stats(shortCode));
    if (cached) return cached;

    const url = await UrlRepository.findByCode(shortCode);
    if (!url) throw new AppError('Short link not found', ErrorCodes.URL_NOT_FOUND, 404);

    const stats = {
      shortCode: url.shortCode,
      shortUrl: `${config.app.baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      title: url.title,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    };

    await redis.set(cacheKey.stats(shortCode), stats, config.cache.urlStatsTtl);
    return stats;
  },
};

module.exports = UrlService;
