const Feedback = require('./feedback.schema');
const ResponseFactory = require('../../shared/utils/response.factory');
const logger = require('../../shared/utils/logger');

class FeedbackController {
  /**
   * Submit feedback or issue
   * POST /api/feedback
   */
  static async submit(req, res) {
    const { name, message, rating, type = 'testimonial', page = '/' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const cleanType = type === 'issue' ? 'issue' : 'testimonial';
    let cleanRating = Number(rating);
    if (isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      cleanRating = 5;
    }

    const feedback = await Feedback.create({
      name: (name || '').trim().slice(0, 100) || 'Anonymous',
      message: message.trim().slice(0, 2000),
      type: cleanType,
      status: 'open',
      approved: false,
      rating: cleanType === 'testimonial' ? cleanRating : undefined,
      page: (page || '').trim().slice(0, 200) || '/',
      ip: req.ip,
    });

    logger.info('[feedback] Submission received', { id: feedback._id, type: cleanType });

    return ResponseFactory.success(
      res,
      {
        id: feedback._id,
        type: feedback.type,
        message: 'Feedback received successfully. Thank you!',
      },
      201
    );
  }

  /**
   * Public: List approved testimonials
   * GET /api/feedback/testimonials
   */
  static async getTestimonials(_req, res) {
    const testimonials = await Feedback.find({ approved: true, type: 'testimonial' })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name message rating createdAt page');

    return ResponseFactory.success(res, testimonials);
  }

  /**
   * Public: List all issues with their status
   * GET /api/feedback/issues
   */
  static async getIssues(_req, res) {
    const issues = await Feedback.find({ type: 'issue' })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('name message status createdAt page');

    return ResponseFactory.success(res, issues);
  }

  /**
   * Admin: List all feedbacks (with optional filters)
   * GET /api/feedback/admin
   */
  static async listAdmin(req, res) {
    const { type, status, approved } = req.query || {};
    const query = {};

    if (type && ['testimonial', 'issue'].includes(type)) {
      query.type = type;
    }
    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      query.status = status;
    }
    if (approved !== undefined) {
      query.approved = approved === 'true';
    }

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(200);

    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$approved', false] }, { $eq: ['$type', 'testimonial'] }] }, 1, 0] },
          },
          openIssuesCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$type', 'issue'] }, { $eq: ['$status', 'open'] }] }, 1, 0] },
          },
          approvedCount: { $sum: { $cond: ['$approved', 1, 0] } },
        },
      },
    ]);

    return ResponseFactory.success(res, {
      summary: stats[0] || { total: 0, pendingCount: 0, openIssuesCount: 0, approvedCount: 0 },
      feedbacks,
    });
  }

  /**
   * Admin: Approve or reject feedback/testimonial
   * PATCH /api/feedback/:id/approve
   */
  static async setApproval(req, res) {
    const { id } = req.params;
    const { approved } = req.body || {};

    const item = await Feedback.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    item.approved = approved !== undefined ? Boolean(approved) : !item.approved;
    await item.save();

    logger.info('[feedback] Approval updated', { id: item._id, approved: item.approved });

    return ResponseFactory.success(res, {
      id: item._id,
      approved: item.approved,
    });
  }

  /**
   * Admin: Update issue status
   * PATCH /api/feedback/:id/status
   */
  static async setStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: open, in_progress, resolved',
      });
    }

    const item = await Feedback.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    item.status = status;
    await item.save();

    logger.info('[feedback] Status updated', { id: item._id, status: item.status });

    return ResponseFactory.success(res, {
      id: item._id,
      status: item.status,
    });
  }

  /**
   * Admin: Delete feedback item
   * DELETE /api/feedback/:id
   */
  static async deleteFeedback(req, res) {
    const { id } = req.params;
    const item = await Feedback.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    logger.info('[feedback] Deleted feedback', { id });

    return ResponseFactory.success(res, { message: 'Feedback deleted successfully' });
  }
}

module.exports = FeedbackController;
