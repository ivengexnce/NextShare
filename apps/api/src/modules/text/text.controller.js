const TextService = require('./text.service');
const ResponseFactory = require('../../shared/utils/response.factory');

const TextController = {
  /** POST /api/pastes */
  async create(req, res) {
    const createdBy = req.ip || 'anonymous';
    const result = await TextService.create(req.body, createdBy);
    return ResponseFactory.success(res, result, 'Paste created', 201);
  },

  /** GET /api/pastes/:code */
  async get(req, res) {
    const { code } = req.params;
    const result = await TextService.get(code);
    return ResponseFactory.success(res, result, 'Paste retrieved');
  },

  /** GET /api/pastes/meta/presets — returns valid expiry options and languages */
  async presets(req, res) {
    return ResponseFactory.success(res, {
      expiryPresets: TextService.expiryPresets,
      languages: TextService.supportedLanguages,
    });
  },
};

module.exports = TextController;
