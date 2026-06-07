const { Router } = require('express');
const TextController = require('./text.controller');
const { pasteCreateLimiter, generalLimiter } = require('../../shared/middleware/rateLimit.middleware');

const router = Router();

router.get('/meta/presets', TextController.presets);
router.post('/',            pasteCreateLimiter, TextController.create);
router.get('/:code',        generalLimiter,     TextController.get);

module.exports = router;
