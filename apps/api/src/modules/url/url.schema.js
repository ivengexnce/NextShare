const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
      index: true,          // primary lookup key — always indexed
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 255,
      default: '',
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Scaling rule: store click timestamps sparsely (last 1000), not every one
    clickLog: {
      type: [Date],
      default: [],
      select: false,        // don't load by default — heavy field
    },
    expiresAt: {
      type: Date,
      default: null,        // null = never expires
      index: true,          // TTL index created separately below
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,         // IP or user ID
      default: 'anonymous',
    },
  },
  {
    timestamps: true,       // createdAt + updatedAt auto-managed
    versionKey: false,
  },
);

// ─── TTL Index ─────────────────────────────────────────────────────────────────
// MongoDB auto-deletes documents when expiresAt < now (runs every ~60s)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// ─── Compound Index ────────────────────────────────────────────────────────────
// Common query: active, non-expired links sorted by creation
urlSchema.index({ isActive: 1, createdAt: -1 });

// ─── Virtual ───────────────────────────────────────────────────────────────────
urlSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

const Url = mongoose.model('Url', urlSchema);
module.exports = Url;
