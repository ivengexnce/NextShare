const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

// ─── Env Validation ────────────────────────────────────────────────────────────
// In production, enforce explicit configuration and secure, non-default secrets.
if (process.env.NODE_ENV === 'production') {
    const REQUIRED = ['MONGODB_URI', 'REDIS_URL', 'ADMIN_SECRET'];
    const missing = REQUIRED.filter((k) => !process.env[k]);
    if (missing.length) {
        throw new Error(`[config] Missing required production environment variables: ${missing.join(', ')}`);
    }
    if (process.env.ADMIN_SECRET === 'dev-admin-secret') {
        throw new Error('[config] Insecure default ADMIN_SECRET cannot be used in production environment');
    }
}

// ─── Config Object ─────────────────────────────────────────────────────────────
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,
    isDev: (process.env.NODE_ENV || 'development') === 'development',

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-toolkit',
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    upload: {
        dir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50 MB
        allowedTypes: [
            // HTML & Web
            'text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'application/xml', 'text/xml',
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/bmp', 'image/tiff',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Text & Data
            'text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values',
            // Archives
            'application/zip', 'application/x-zip-compressed', 'application/x-tar', 'application/gzip', 'application/x-gzip', 'application/x-7z-compressed', 'application/vnd.rar',
            // Video & Audio
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
            // Developer text & binary payloads
            'application/octet-stream',
        ],
    },

    app: {
        baseUrl: process.env.BASE_URL || 'http://localhost:3001',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        adminSecret: process.env.ADMIN_SECRET || 'dev-admin-secret',
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },

    // Scaling rule: Redis TTLs defined centrally so they're easy to tune
    cache: {
        urlRedirectTtl: 60 * 60, // 1 hour  — hot redirect path
        urlStatsTtl: 5 * 60, // 5 min   — analytics cache
        pasteTtl: 10 * 60, // 10 min  — text paste cache
    },
};

module.exports = config;