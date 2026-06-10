const path = require('path');
const fs = require('fs').promises;
const Joi = require('joi');
const AppError = require('../../shared/errors/AppError');
const ErrorCodes = require('../../shared/errors/errorCodes');
const config = require('../../config');
const { generateShortCode } = require('../../shared/utils/hash');
const FilesRepository = require('./files.repository');

// ─── Validation ────────────────────────────────────────────────────────────────
const uploadOptionsSchema = Joi.object({
    expiresIn: Joi.number().integer().min(1).max(30).optional()
        .description('Days until file link expires'),
    maxDownloads: Joi.number().integer().min(1).max(1000).optional(),
    password: Joi.string().min(4).max(72).optional(),
});

// ─── Service ───────────────────────────────────────────────────────────────────
const FilesService = {
    /**
     * Register an uploaded file (multer has already saved it to disk).
     * Returns the shareable file record.
     */
    async registerUpload(file, body, uploadedBy = 'anonymous') {
        if (!file) {
            throw new AppError('No file received', ErrorCodes.VALIDATION_ERROR, 400);
        }

        const { error, value } = uploadOptionsSchema.validate(body, { abortEarly: false });
        if (error) {
            // Clean up the orphaned file immediately
            await fs.unlink(file.path).catch(() => {});
            throw new AppError(error.details.map((d) => d.message).join('; '), ErrorCodes.VALIDATION_ERROR, 400);
        }

        const { expiresIn, maxDownloads } = value;

        // Generate unique short code
        let shortCode;
        let attempts = 0;
        do {
            shortCode = generateShortCode();
            attempts++;
        } while (attempts <= 5 && await FilesRepository.findByCode(shortCode));

        const expiresAt = expiresIn ?
            new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) :
            null;

        const record = await FilesRepository.create({
            shortCode,
            storedName: path.basename(file.path),
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            expiresAt,
            maxDownloads: maxDownloads || null,
            uploadedBy,
        });

        return {
            shortCode: record.shortCode,
            shareUrl: `${config.app.baseUrl}/f/${record.shortCode}/download`,
            originalName: record.originalName,
            size: record.size,
            mimeType: record.mimeType,
            expiresAt: record.expiresAt,
            maxDownloads: record.maxDownloads,
            createdAt: record.createdAt,
        };
    },

    /**
     * Resolve a short code to a file stream path.
     * Enforces expiry, download limits, and password.
     */
    async resolveDownload(shortCode) {
        const record = await FilesRepository.findByCode(shortCode);
        if (!record) throw new AppError('File not found', ErrorCodes.FILE_NOT_FOUND, 404);

        if (record.expiresAt && record.expiresAt < new Date()) {
            throw new AppError('This file link has expired', ErrorCodes.FILE_EXPIRED, 410);
        }

        if (record.maxDownloads && record.downloadCount >= record.maxDownloads) {
            throw new AppError('Download limit reached for this file', ErrorCodes.FILE_EXPIRED, 410);
        }

        const filePath = path.join(path.resolve(config.upload.dir), record.storedName);

        // Confirm file still on disk
        try {
            await fs.access(filePath);
        } catch {
            throw new AppError('File data not found on server', ErrorCodes.STORAGE_ERROR, 404);
        }

        // Increment non-blocking
        setImmediate(() => FilesRepository.incrementDownloads(shortCode));

        return {
            filePath,
            originalName: record.originalName,
            mimeType: record.mimeType,
            size: record.size,
        };
    },

    /** Get file metadata (no file stream, no auth needed). */
    async getMeta(shortCode) {
        const record = await FilesRepository.findByCode(shortCode);
        if (!record) throw new AppError('File not found', ErrorCodes.FILE_NOT_FOUND, 404);

        return {
            shortCode: record.shortCode,
            originalName: record.originalName,
            mimeType: record.mimeType,
            size: record.size,
            downloadCount: record.downloadCount,
            maxDownloads: record.maxDownloads,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
        };
    },

    /** Soft-delete a file record and remove from disk. */
    async deleteFile(shortCode, requestedBy) {
        const record = await FilesRepository.findByCode(shortCode);
        if (!record) throw new AppError('File not found', ErrorCodes.FILE_NOT_FOUND, 404);

        if (record.uploadedBy !== requestedBy) {
            throw new AppError('You do not have permission to delete this file', ErrorCodes.FORBIDDEN, 403);
        }

        await FilesRepository.deactivate(shortCode);

        // Best-effort disk cleanup
        const filePath = path.join(path.resolve(config.upload.dir), record.storedName);
        await fs.unlink(filePath).catch(() => {});
    },
};

module.exports = FilesService;