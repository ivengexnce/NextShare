const { Router } = require('express');
const AdminController = require('./admin.controller');
const config = require('../../config');
const { timingSafeCompare } = require('../../shared/utils/hash');
const { adminLimiter } = require('../../shared/middleware/rateLimit.middleware');

const router = Router();

// Serve standalone admin dashboard on GET /admin
router.get('/', (req, res, next) => {
    if (req.accepts('html') || !req.headers['x-admin-secret']) {
        return AdminController.portal(req, res);
    }
    next();
});

// Throttle admin access attempts to prevent brute-forcing x-admin-secret (15 attempts per 15 min)
router.use(adminLimiter);

// Protect all admin API data endpoints with timing-safe comparison
router.use((req, res, next) => {
    const secret = req.headers['x-admin-secret'];
    if (!secret || !config.app.adminSecret || !timingSafeCompare(secret, config.app.adminSecret)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

router.get('/stats', AdminController.stats);

module.exports = router;