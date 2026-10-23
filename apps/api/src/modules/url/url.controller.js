const UrlService = require('./url.service');
const ResponseFactory = require('../../shared/utils/response.factory');
const { client: redisClient } = require('../../config/redis');

const config = require('../../config');

function getBaseUrl(req) {
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
    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    if (host && !host.includes('localhost')) {
        return `${proto}://${host}`.replace(/\/+$/, '');
    }
    return (config.app.baseUrl || 'https://nextsharebymeet.vercel.app').replace(/\/+$/, '');
}

const UrlController = {
    async shorten(req, res) {
        const createdBy = req.ip || 'anonymous';
        const baseUrl = getBaseUrl(req);
        const result = await UrlService.shorten(req.body, createdBy, baseUrl);
        return ResponseFactory.success(res, result, 'Short link created', 201);
    },

    async redirect(req, res) {
        const { code } = req.params;
        const originalUrl = await UrlService.resolve(code);
        const ip = req.ip || 'unknown';
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