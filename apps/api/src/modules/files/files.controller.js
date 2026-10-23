const FilesService = require('./files.service');
const ResponseFactory = require('../../shared/utils/response.factory');
const { client: redisClient } = require('../../config/redis');

const FilesController = {
    async upload(req, res) {
        const uploadedBy = req.ip || 'anonymous';
        const result = await FilesService.registerUpload(req.file, req.body, uploadedBy);
        return ResponseFactory.success(res, result, 'File uploaded successfully', 201);
    },

    async download(req, res) {
        const { code } = req.params;
        const password = req.headers['x-file-password'] || req.query.password;
        const { filePath, originalName, mimeType, size, sha256 } = await FilesService.resolveDownload(code, password);

        const ip = req.ip || 'unknown';
        redisClient.sAdd(`visitors:file:${code}`, ip).catch(() => {});

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        if (sha256) {
            res.setHeader('ETag', `"${sha256}"`);
            res.setHeader('X-Checksum-SHA256', sha256);
        }

        const nodePath = require('path');
        return res.sendFile(nodePath.basename(filePath), {
            root: nodePath.dirname(filePath),
            dotfiles: 'deny',
        });
    },

    async meta(req, res) {
        const { code } = req.params;
        const result = await FilesService.getMeta(code);
        return ResponseFactory.success(res, result, 'File metadata retrieved');
    },

    async remove(req, res) {
        const { code } = req.params;
        const deleteToken = req.headers['x-delete-token'] || req.query.deleteToken || req.body?.deleteToken;
        const adminSecret = req.headers['x-admin-secret'];
        await FilesService.deleteFile(code, deleteToken, adminSecret);
        return ResponseFactory.success(res, null, 'File deleted');
    },
};

module.exports = FilesController;