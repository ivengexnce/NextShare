const { Router } = require('express');
const UrlController = require('./url.controller');
const { urlCreateLimiter, urlRedirectLimiter } = require('../../shared/middleware/rateLimit.middleware');

const router = Router();

// POST /api/urls — create short link
router.post('/', urlCreateLimiter, UrlController.shorten);

// GET /api/urls/:code/stats — analytics
router.get('/:code/stats', urlRedirectLimiter, UrlController.stats);

module.exports = router;
