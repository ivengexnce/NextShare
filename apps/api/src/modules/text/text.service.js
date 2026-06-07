const Joi = require('joi');
const AppError = require('../../shared/errors/AppError');
const ErrorCodes = require('../../shared/errors/errorCodes');
const redis = require('../../config/redis');
const config = require('../../config');
const { generateShortCode } = require('../../shared/utils/hash');
const TextRepository = require('./text.repository');
const { SUPPORTED_LANGUAGES } = require('./text.schema');

// ─── Expiry presets (minutes) ──────────────────────────────────────────────────
const EXPIRY_PRESETS = {
  '10m':  10,
  '1h':   60,
  '24h':  60 * 24,
  '7d':   60 * 24 * 7,
  '30d':  60 * 24 * 30,
  never:  null,
};

// ─── Validation ────────────────────────────────────────────────────────────────
const createSchema = Joi.object({
  content:       Joi.string().min(1).max(500_000).required(),
  language:      Joi.string().valid(...SUPPORTED_LANGUAGES).default('plaintext'),
  title:         Joi.string().max(255).optional().allow(''),
  expiresIn:     Joi.string().valid(...Object.keys(EXPIRY_PRESETS)).default('never'),
  burnAfterRead: Joi.boolean().default(false),
});

// ─── Cache Helpers ─────────────────────────────────────────────────────────────
const cacheKey = (code) => `paste:${code}`;

// ─── Service ───────────────────────────────────────────────────────────────────
const TextService = {
  async create(payload, createdBy = 'anonymous') {
    const { error, value } = createSchema.validate(payload, { abortEarly: false });
    if (error) {
      throw new AppError(error.details.map((d) => d.message).join('; '), ErrorCodes.VALIDATION_ERROR, 400);
    }

    const { content, language, title, expiresIn, burnAfterRead } = value;

    // Resolve expiry
    const minutes = EXPIRY_PRESETS[expiresIn];
    const expiresAt = minutes ? new Date(Date.now() + minutes * 60 * 1000) : null;

    // Generate unique code
    const shortCode = generateShortCode();

    const paste = await TextRepository.create({
      shortCode,
      content,
      language,
      title,
      expiresAt,
      burnAfterRead,
      createdBy,
    });

    // Cache — but only if NOT burn-after-read (burned pastes must always hit DB)
    if (!burnAfterRead) {
      const ttlSeconds = minutes ? minutes * 60 : config.cache.pasteTtl;
      await redis.set(cacheKey(shortCode), {
        content, language, title, expiresAt, burnAfterRead, viewCount: 0,
      }, ttlSeconds);
    }

    return {
      shortCode: paste.shortCode,
      shareUrl: `${config.app.baseUrl}/paste/${paste.shortCode}`,
      title: paste.title,
      language: paste.language,
      expiresAt: paste.expiresAt,
      burnAfterRead: paste.burnAfterRead,
      createdAt: paste.createdAt,
    };
  },

  async get(shortCode) {
    // 1. Skip cache for burn-after-read (must be DB to enforce single-view)
    const cached = await redis.get(cacheKey(shortCode));
    if (cached && !cached.burnAfterRead) {
      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await redis.del(cacheKey(shortCode));
        throw new AppError('This paste has expired', ErrorCodes.PASTE_EXPIRED, 410);
      }
      setImmediate(() => TextRepository.incrementViews(shortCode));
      return cached;
    }

    // 2. DB lookup
    const paste = await TextRepository.findByCode(shortCode);
    if (!paste) throw new AppError('Paste not found', ErrorCodes.PASTE_NOT_FOUND, 404);

    if (paste.expiresAt && paste.expiresAt < new Date()) {
      throw new AppError('This paste has expired', ErrorCodes.PASTE_EXPIRED, 410);
    }

    // 3. Burn-after-read — destroy immediately after returning content
    if (paste.burnAfterRead) {
      setImmediate(() => TextRepository.destroy(shortCode));
    } else {
      setImmediate(() => TextRepository.incrementViews(shortCode));
    }

    const result = {
      shortCode: paste.shortCode,
      content: paste.content,
      language: paste.language,
      title: paste.title,
      expiresAt: paste.expiresAt,
      burnAfterRead: paste.burnAfterRead,
      viewCount: paste.viewCount,
      createdAt: paste.createdAt,
    };

    return result;
  },

  expiryPresets: Object.keys(EXPIRY_PRESETS),
  supportedLanguages: SUPPORTED_LANGUAGES,
};

module.exports = TextService;
