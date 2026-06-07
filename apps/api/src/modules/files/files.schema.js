const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // ── Stored file metadata ──────────────────────────────────────────────────
    storedName: {
      type: String,     // disk filename (token + ext)
      required: true,
    },
    originalName: {
      type: String,     // user's original filename
      required: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,     // bytes
      required: true,
    },
    // ── Sharing settings ──────────────────────────────────────────────────────
    downloadCount: {
      type: Number,
      default: 0,
    },
    maxDownloads: {
      type: Number,
      default: null,    // null = unlimited
    },
    password: {
      type: String,     // bcrypt hash — null if no password
      default: null,
      select: false,    // never return password hash to clients
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    uploadedBy: {
      type: String,
      default: 'anonymous',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// TTL — auto-delete expired file records (actual file cleanup is a cron job)
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const File = mongoose.model('File', fileSchema);
module.exports = File;
