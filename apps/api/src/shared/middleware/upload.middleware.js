const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const AppError = require('../errors/AppError');
const ErrorCodes = require('../errors/errorCodes');
const { generateToken } = require('../utils/hash');

// ─── Ensure Upload Dir Exists ──────────────────────────────────────────────────
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Storage Engine ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    // Store as {token}.{ext} to prevent directory traversal & collisions
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${generateToken()}${ext}`);
  },
});

// ─── File Filter ───────────────────────────────────────────────────────────────
function fileFilter(_req, file, cb) {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type "${file.mimetype}" is not allowed`,
        ErrorCodes.INVALID_FILE_TYPE,
        415,
      ),
    );
  }
}

// ─── Multer Instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,        // one file per request
    fields: 10,      // cap text fields
  },
});

/**
 * Single-file upload middleware.
 * Usage: router.post('/upload', uploadMiddleware, filesController.upload)
 */
const uploadMiddleware = upload.single('file');

module.exports = uploadMiddleware;
