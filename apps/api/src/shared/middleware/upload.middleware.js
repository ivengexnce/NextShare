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

// ─── Allowed Extensions Set (defence-in-depth alongside MIME types) ────────────
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf',
  '.txt', '.md', '.csv',
  '.zip',
  '.doc', '.docx', '.xls', '.xlsx',
  '.mp4', '.webm',
  '.mp3', '.wav', '.ogg',
]);

// ─── Storage Engine ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    // Sanitize and extract extension
    const cleanBasename = path.basename(file.originalname).replace(/[\x00-\x1f\x7f]/g, '');
    const ext = path.extname(cleanBasename).toLowerCase();
    // Store as {token}{ext} inside upload directory to prevent traversal and overwrites
    cb(null, `${generateToken()}${ext}`);
  },
});

// ─── File Filter ───────────────────────────────────────────────────────────────
function fileFilter(req, file, cb) {
  const cleanBasename = path.basename(file.originalname || '').replace(/[\x00-\x1f\x7f]/g, '');
  const ext = path.extname(cleanBasename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    req.fileValidationError = `File extension "${ext || 'none'}" is not permitted`;
    return cb(null, false);
  }

  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    req.fileValidationError = `File type "${file.mimetype}" is not allowed`;
    return cb(null, false);
  }

  cb(null, true);
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

const uploadSingle = upload.single('file');

/**
 * Single-file upload middleware with smooth stream consumption and error mapping.
 */
function uploadMiddleware(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.fileValidationError) {
      return next(
        new AppError(
          req.fileValidationError,
          ErrorCodes.INVALID_FILE_TYPE,
          415,
        ),
      );
    }
    next();
  });
}

module.exports = uploadMiddleware;
