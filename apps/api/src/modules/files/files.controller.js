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
        const { filePath, originalName, mimeType, size } = await FilesService.resolveDownload(code);
        const ip = req.headers['x-forwarded-for'] ?
            req.headers['x-forwarded-for'].split(',')[0].trim() :
            (req.ip || 'unknown');
        redisClient.sAdd(`visitors:file:${code}`, ip).catch(() => {});

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(filePath, { dotfiles: 'deny' });
    },

    async meta(req, res) {
        const { code } = req.params;
        const result = await FilesService.getMeta(code);
        return ResponseFactory.success(res, result, 'File metadata retrieved');
    },

    async remove(req, res) {
        const { code } = req.params;
        const requestedBy = req.ip || 'anonymous';
        await FilesService.deleteFile(code, requestedBy);
        return ResponseFactory.success(res, null, 'File deleted');
    },
};

module.exports = FilesController;