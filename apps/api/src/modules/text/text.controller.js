const TextService = require('./text.service');
const ResponseFactory = require('../../shared/utils/response.factory');
const { client: redisClient } = require('../../config/redis');

const TextController = {
    async create(req, res) {
        const createdBy = req.ip || 'anonymous';
        const result = await TextService.create(req.body, createdBy);
        return ResponseFactory.success(res, result, 'Paste created', 201);
    },

    get: async(req, res) => {
        const { code } = req.params;
        const result = await TextService.get(code);
        const ip = req.headers['x-forwarded-for'] ?
            req.headers['x-forwarded-for'].split(',')[0].trim() :
            (req.ip || 'unknown');
        redisClient.sAdd(`visitors:paste:${code}`, ip).catch(() => {});
        return ResponseFactory.success(res, result, 'Paste retrieved');
    },

    async presets(req, res) {
        return ResponseFactory.success(res, {
            expiryPresets: TextService.expiryPresets,
            languages: TextService.supportedLanguages,
        });
    },
};

module.exports = TextController;