const mongoose = require('mongoose');
const { client } = require('../../config/redis');
const { getAdminPortalHtml } = require('./admin.portal');

async function safeCard(key) {
    try { return await client.sCard(key); } catch { return 0; }
}

const getModel = (name) => {
    try { return mongoose.model(name); } catch { return null; }
};

const AdminController = {
    portal(_req, res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8').send(getAdminPortalHtml());
    },

    async stats(_req, res) {
        const globalVisitors = await safeCard('visitors:global');

        const [UrlModel, PasteModel, FileModel] = [
            getModel('Url') || getModel('URL') || getModel('ShortUrl'),
            getModel('Paste') || getModel('Text') || getModel('TextPaste'),
            getModel('File') || getModel('Upload') || getModel('SharedFile'),
        ];

        const [urls, pastes, files] = await Promise.all([
            UrlModel ? UrlModel.find({}).lean().limit(1000) : [],
            PasteModel ? PasteModel.find({}).lean().limit(1000) : [],
            FileModel ? FileModel.find({}).lean().limit(1000) : [],
        ]);

        const [urlData, pasteData, fileData] = await Promise.all([
            Promise.all(urls.map(async (u) => ({
                code: u.shortCode,
                originalUrl: u.originalUrl,
                clicks: u.clicks || 0,
                uniqueViews: await safeCard(`visitors:url:${u.shortCode}`),
                createdAt: u.createdAt,
            }))),
            Promise.all(pastes.map(async (p) => ({
                code: p.shortCode,
                title: p.title || 'Untitled',
                language: p.language,
                views: p.viewCount || 0,
                uniqueViews: await safeCard(`visitors:paste:${p.shortCode}`),
                createdAt: p.createdAt,
            }))),
            Promise.all(files.map(async (f) => ({
                code: f.shortCode,
                filename: f.originalName || f.filename || f.shortCode,
                downloads: f.downloadCount || 0,
                uniqueViews: await safeCard(`visitors:file:${f.shortCode}`),
                sha256: f.sha256 || null,
                createdAt: f.createdAt,
            }))),
        ]);

        res.json({
            success: true,
            data: {
                globalVisitors,
                totals: { urls: urlData.length, pastes: pasteData.length, files: fileData.length },
                urls: urlData,
                pastes: pasteData,
                files: fileData,
            },
        });
    },
};

module.exports = AdminController;
