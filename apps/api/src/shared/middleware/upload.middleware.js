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
  // Web & HTML
  '.html', '.htm', '.css', '.js', '.mjs', '.jsx', '.ts', '.tsx', '.json', '.xml',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Text & Data
  '.txt', '.md', '.markdown', '.csv', '.tsv', '.log',
  // Developer source & configs
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs', '.sql', '.sh', '.yaml', '.yml', '.toml', '.ini',
  // Archives
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar',
  // Media
  '.mp4', '.webm', '.mov',
  '.mp3', '.wav', '.ogg', '.m4a',
]);

// ─── Blocked Executable Extensions ─────────────────────────────────────────────
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.msi', '.dll', '.com', '.scr',
  '.jar', '.apk', '.iso', '.dmg', '.pif', '.application', '.gadget', '.wsf', '.cpl', '.reg',
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

  if (BLOCKED_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
    req.fileValidationError = `File extension "${ext || 'none'}" is not permitted`;
    return cb(null, false);
  }

  const mime = file.mimetype || '';
  if (!config.upload.allowedTypes.includes(mime) && !mime.startsWith('text/')) {
    req.fileValidationError = `File type "${mime}" is not allowed`;
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
