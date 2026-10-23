const TextService = require('./text.service');
const ResponseFactory = require('../../shared/utils/response.factory');
const { client: redisClient } = require('../../config/redis');
const config = require('../../config');

function getFrontendUrl(req) {
    const origin = req.get('origin');
    if (origin && !origin.includes('localhost')) {
        return origin.replace(/\/+$/, '');
    }
    const referer = req.get('referer');
    if (referer) {
        try {
            const parsed = new URL(referer);
            if (!parsed.origin.includes('localhost')) {
                return parsed.origin;
            }
        } catch {}
    }
    if (config.app.frontendUrl && !config.app.frontendUrl.includes('localhost')) {
        return config.app.frontendUrl.replace(/\/+$/, '');
    }
    return (config.app.frontendUrl || 'https://nextsharebymeet.vercel.app').replace(/\/+$/, '');
}

const TextController = {
    async create(req, res) {
        const createdBy = req.ip || 'anonymous';
        const frontendUrl = getFrontendUrl(req);
        const result = await TextService.create(req.body, createdBy, frontendUrl);
        return ResponseFactory.success(res, result, 'Paste created', 201);
    },

    get: async(req, res) => {
        const { code } = req.params;
        const result = await TextService.get(code);
        const ip = req.ip || 'unknown';
        redisClient.sAdd(`visitors:paste:${code}`, ip).catch(() => {});
        return ResponseFactory.success(res, result, 'Paste retrieved');
    },

    async burn(req, res) {
        const { code } = req.params;
        await TextService.burn(code);
        return ResponseFactory.success(res, null, 'Paste burned');
    },

    async presets(req, res) {
        return ResponseFactory.success(res, {
            expiryPresets: TextService.expiryPresets,
            languages: TextService.supportedLanguages,
        });
    },
};

module.exports = TextController;