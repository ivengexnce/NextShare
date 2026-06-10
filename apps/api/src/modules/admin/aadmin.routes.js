const { Router } = require('express');
const AdminController = require('./admin.controller');
const config = require('../../config');

const router = Router();

router.use((req, res, next) => {
    const secret = req.headers['x-admin-secret'];
    if (!secret || secret !== config.app.adminSecret) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

router.get('/stats', AdminController.stats);

module.exports = router;