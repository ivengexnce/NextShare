const { Router } = require('express');
const AdminController = require('./admin.controller');
const config = require('../../config');
const { timingSafeCompare } = require('../../shared/utils/hash');
const { adminLimiter } = require('../../shared/middleware/rateLimit.middleware');

const router = Router();

// Throttle admin access attempts to prevent brute-forcing x-admin-secret (15 attempts per 15 min)
router.use(adminLimiter);

router.use((req, res, next) => {
    const secret = req.headers['x-admin-secret'];
    if (!secret || !config.app.adminSecret || !timingSafeCompare(secret, config.app.adminSecret)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

router.get('/stats', AdminController.stats);

module.exports = router;