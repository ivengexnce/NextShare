const { Router } = require('express');
const FeedbackController = require('./feedback.controller');
const config = require('../../config');
const { timingSafeCompare } = require('../../shared/utils/hash');

const router = Router();

// Middleware: verify admin authentication
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || !config.app.adminSecret || !timingSafeCompare(secret, config.app.adminSecret)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// Public endpoints
router.post('/', FeedbackController.submit);
router.get('/testimonials', FeedbackController.getTestimonials);
router.get('/issues', FeedbackController.getIssues);

// Admin endpoints (require x-admin-secret)
router.get('/admin', requireAdmin, FeedbackController.listAdmin);
router.patch('/:id/approve', requireAdmin, FeedbackController.setApproval);
router.patch('/:id/status', requireAdmin, FeedbackController.setStatus);
router.delete('/:id', requireAdmin, FeedbackController.deleteFeedback);

module.exports = router;
