const UrlService = require('./url.service');
const ResponseFactory = require('../../shared/utils/response.factory');
const { client: redisClient } = require('../../config/redis');

const UrlController = {
    async shorten(req, res) {
        const createdBy = req.ip || 'anonymous';
        const result = await UrlService.shorten(req.body, createdBy);
        return ResponseFactory.success(res, result, 'Short link created', 201);
    },

    async redirect(req, res) {
        const { code } = req.params;
        const originalUrl = await UrlService.resolve(code);
        const ip = req.headers['x-forwarded-for'] ?
            req.headers['x-forwarded-for'].split(',')[0].trim() :
            (req.ip || 'unknown');
        redisClient.sAdd(`visitors:url:${code}`, ip).catch(() => {});
        return ResponseFactory.redirect(res, originalUrl);
    },

    async stats(req, res) {
        const { code } = req.params;
        const result = await UrlService.getStats(code);
        return ResponseFactory.success(res, result, 'Stats retrieved');
    },
};

module.exports = UrlController;