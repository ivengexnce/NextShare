/**
 * ErrorCodes — machine-readable error identifiers.
 *
 * Rules:
 *  • Add new codes here; never inline strings in services/controllers.
 *  • Group by HTTP semantic (client errors, server errors).
 *  • Frontend can switch on these codes for i18n-friendly messages.
 */
const ErrorCodes = {
  // ─── 400 Bad Request ────────────────────────────────────────────────────────
  VALIDATION_ERROR:     'VALIDATION_ERROR',
  INVALID_URL:          'INVALID_URL',
  INVALID_FILE_TYPE:    'INVALID_FILE_TYPE',
  FILE_TOO_LARGE:       'FILE_TOO_LARGE',
  CONTENT_TOO_LONG:     'CONTENT_TOO_LONG',
  CODE_TAKEN:           'CODE_TAKEN',

  // ─── 401 / 403 ──────────────────────────────────────────────────────────────
  UNAUTHORIZED:         'UNAUTHORIZED',
  FORBIDDEN:            'FORBIDDEN',
  WRONG_PASSWORD:       'WRONG_PASSWORD',

  // ─── 404 Not Found ──────────────────────────────────────────────────────────
  NOT_FOUND:            'NOT_FOUND',
  URL_NOT_FOUND:        'URL_NOT_FOUND',
  FILE_NOT_FOUND:       'FILE_NOT_FOUND',
  PASTE_NOT_FOUND:      'PASTE_NOT_FOUND',

  // ─── 410 Gone ───────────────────────────────────────────────────────────────
  URL_EXPIRED:          'URL_EXPIRED',
  FILE_EXPIRED:         'FILE_EXPIRED',
  PASTE_EXPIRED:        'PASTE_EXPIRED',
  PASTE_BURNED:         'PASTE_BURNED',

  // ─── 429 Rate Limited ───────────────────────────────────────────────────────
  RATE_LIMITED:         'RATE_LIMITED',

  // ─── 500 Server ─────────────────────────────────────────────────────────────
  INTERNAL_ERROR:       'INTERNAL_ERROR',
  DB_ERROR:             'DB_ERROR',
  STORAGE_ERROR:        'STORAGE_ERROR',
};

module.exports = ErrorCodes;
