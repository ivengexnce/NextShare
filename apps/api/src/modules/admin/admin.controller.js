const mongoose = require('mongoose');
const { client } = require('../../config/redis');

async function safeCard(key) {
    try { return await client.sCard(key); } catch { return 0; }
}

function tryModel(name) {
    try { return mongoose.model(name); } catch { return null; }
}

const AdminController = {
    async stats(_req, res) {
        const globalVisitors = await safeCard('visitors:global');

        const urlData = [],
            pasteData = [],
            fileData = [];

        // URLs
        const UrlModel = tryModel('Url') || tryModel('URL') || tryModel('ShortUrl');
        if (UrlModel) {
            const items = await UrlModel.find({}).lean().limit(1000);
            for (const u of items) {
                urlData.push({
                    code: u.shortCode,
                    originalUrl: u.originalUrl,
                    clicks: u.clickCount || 0,
                    uniqueViews: await safeCard(`visitors:url:${u.shortCode}`),
                    createdAt: u.createdAt,
                });
            }
        }

        // Pastes
        const PasteModel = tryModel('Text') || tryModel('Paste') || tryModel('TextPaste');
        if (PasteModel) {
            const items = await PasteModel.find({}).lean().limit(1000);
            for (const p of items) {
                pasteData.push({
                    code: p.shortCode,
                    title: p.title || 'Untitled',
                    language: p.language,
                    views: p.viewCount || 0,
                    uniqueViews: await safeCard(`visitors:paste:${p.shortCode}`),
                    createdAt: p.createdAt,
                });
            }
        }

        // Files
        const FileModel = tryModel('File') || tryModel('Upload') || tryModel('SharedFile');
        if (FileModel) {
            const items = await FileModel.find({}).lean().limit(1000);
            for (const f of items) {
                fileData.push({
                    code: f.shortCode,
                    filename: f.originalName || f.filename || f.shortCode,
                    downloads: f.downloadCount || 0,
                    uniqueViews: await safeCard(`visitors:file:${f.shortCode}`),
                    createdAt: f.createdAt,
                });
            }
        }

        res.json({
            success: true,
            data: {
                globalVisitors,
                totals: {
                    urls: urlData.length,
                    pastes: pasteData.length,
                    files: fileData.length,
                },
                urls: urlData,
                pastes: pasteData,
                files: fileData,
            },
        });
    },
};

module.exports = AdminController;