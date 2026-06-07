const mongoose = require('mongoose');

const SUPPORTED_LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
  'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css',
  'json', 'yaml', 'toml', 'markdown', 'sql', 'bash', 'dockerfile',
];

const pasteSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500_000, // 500 KB of text
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: 'plaintext',
    },
    title: {
      type: String,
      maxlength: 255,
      default: '',
    },
    // ── Lifecycle ─────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: null,
    },
    burnAfterRead: {
      type: Boolean,
      default: false,   // if true, delete on first view
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: 'anonymous',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

pasteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const Paste = mongoose.model('Paste', pasteSchema);

module.exports = { Paste, SUPPORTED_LANGUAGES };
