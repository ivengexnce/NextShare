const { Router } = require('express');
const FilesController = require('./files.controller');
const uploadMiddleware = require('../../shared/middleware/upload.middleware');
const { fileUploadLimiter, fileDownloadLimiter, generalLimiter } = require('../../shared/middleware/rateLimit.middleware');

const router = Router();

// POST /api/files/upload
router.post('/upload', fileUploadLimiter, uploadMiddleware, FilesController.upload);

// GET /api/files/:code/download
router.get('/:code/download', fileDownloadLimiter, FilesController.download);

// GET /api/files/:code  — metadata
router.get('/:code', generalLimiter, FilesController.meta);

// DELETE /api/files/:code
router.delete('/:code', generalLimiter, FilesController.remove);

module.exports = router;
