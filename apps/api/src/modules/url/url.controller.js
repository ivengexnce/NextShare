const UrlService = require('./url.service');
const ResponseFactory = require('../../shared/utils/response.factory');

/**
 * UrlController — HTTP handlers only.
 *
 * Layer rule: no business logic, no DB calls, no error construction.
 *             Controllers delegate to services and format responses.
 *
 * express-async-errors is required in app.js so async throws are caught
 * automatically and forwarded to errorMiddleware.
 */
const UrlController = {
  /** POST /api/urls */
  async shorten(req, res) {
    const createdBy = req.ip || 'anonymous';
    const result = await UrlService.shorten(req.body, createdBy);
    return ResponseFactory.success(res, result, 'Short link created', 201);
  },

  /** GET /:code  — redirect endpoint (lives at root, not /api/) */
  async redirect(req, res) {
    const { code } = req.params;
    const originalUrl = await UrlService.resolve(code);
    return ResponseFactory.redirect(res, originalUrl);
  },

  /** GET /api/urls/:code/stats */
  async stats(req, res) {
    const { code } = req.params;
    const result = await UrlService.getStats(code);
    return ResponseFactory.success(res, result, 'Stats retrieved');
  },
};

module.exports = UrlController;
