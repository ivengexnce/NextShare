require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./shared/utils/logger');
const errorMiddleware = require('./shared/middleware/error.middleware');
const visitorMiddleware = require('./shared/middleware/visitor.middleware');
const { generalLimiter, urlRedirectLimiter } = require('./shared/middleware/rateLimit.middleware');
const ResponseFactory = require('./shared/utils/response.factory');

const urlRoutes = require('./modules/url/url.routes');
const filesRoutes = require('./modules/files/files.routes');
const textRoutes = require('./modules/text/text.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const UrlController = require('./modules/url/url.controller');

const app = express();

// Trust proxy — required for correct req.ip behind Render's load balancer
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
    origin: (origin, callback) => {
        const allowed = [config.app.corsOrigin, /\.netlify\.app$/, /\.vercel\.app$/];
        if (!origin) return callback(null, true);
        const ok = allowed.some((p) =>
            typeof p === 'string' ? p === origin : p.test(origin)
        );
        callback(ok ? null : new Error('CORS blocked'), ok);
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
    morgan(config.isDev ? 'dev' : 'combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
        skip: (_req, res) => res.statusCode < 400 && !config.isDev,
    }),
);

// Track every visitor globally
app.use(visitorMiddleware);

app.use('/api', generalLimiter);

app.get('/health', (_req, res) =>
    ResponseFactory.success(res, {
        status: 'ok',
        env: config.env,
        uptime: Math.floor(process.uptime()),
    }),
);

app.use('/api/urls', urlRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/pastes', textRoutes);
app.use('/admin', adminRoutes);

app.get('/:code([a-zA-Z0-9-]{3,20})', urlRedirectLimiter, UrlController.redirect);

app.use((_req, res) =>
    res.status(404).json({ success: false, message: 'Route not found' })
);

app.use(errorMiddleware);

module.exports = app;