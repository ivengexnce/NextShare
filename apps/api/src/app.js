require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const config = require('./config');
const logger = require('./shared/utils/logger');
const errorMiddleware = require('./shared/middleware/error.middleware');
const { generalLimiter, urlRedirectLimiter } = require('./shared/middleware/rateLimit.middleware');
const ResponseFactory = require('./shared/utils/response.factory');

// ─── Route Modules ─────────────────────────────────────────────────────────────
const urlRoutes = require('./modules/url/url.routes');
const filesRoutes = require('./modules/files/files.routes');
const textRoutes = require('./modules/text/text.routes');
const UrlController = require('./modules/url/url.controller');

// ─── App ───────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: config.app.corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ─── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── HTTP Logging ──────────────────────────────────────────────────────────────
app.use(
    morgan(config.isDev ? 'dev' : 'combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
        skip: (_req, res) => res.statusCode < 400 && !config.isDev,
    }),
);

// ─── Global Rate Limit ─────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
    ResponseFactory.success(res, {
        status: 'ok',
        env: config.env,
        uptime: Math.floor(process.uptime()),
    }),
);

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/urls', urlRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/pastes', textRoutes);

// ─── URL Redirect (root-level shortlink) ───────────────────────────────────────
// Must be AFTER /api routes to avoid shadowing them
app.get('/:code([a-zA-Z0-9-]{3,20})', urlRedirectLimiter, UrlController.redirect);

// ─── Frontend Static Files (production only) ───────────────────────────────────
// In dev, Vite serves the frontend on port 5173 with historyApiFallback.
// In prod, Express serves the built React app and handles all frontend routes.
if (!config.isDev) {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get(/^\/(?!api).*/, (_req, res) =>
        res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    );
}

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) =>
    res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Error Middleware (must be last) ───────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;