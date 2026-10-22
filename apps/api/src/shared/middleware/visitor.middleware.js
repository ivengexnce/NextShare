const { client } = require('../../config/redis');

async function visitorMiddleware(req, _res, next) {
    try {
        const ip = req.ip || 'unknown';
        await client.sAdd('visitors:global', ip);
    } catch (_) {}
    next();
}

module.exports = visitorMiddleware;