// nanoid v3 — CommonJS-compatible (v4+ is ESM-only)
const { nanoid, customAlphabet } = require('nanoid');

// URL-safe alphabet — excludes confusable chars (0, O, l, I)
const URL_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a random short code.
 * @param {number} [size=7]  Default 7 → ~57B combinations, collision-resistant for millions of links
 */
const generateShortCode = customAlphabet(URL_ALPHABET, 7);

/**
 * Generate a longer download token (e.g. for file share links).
 * 12 chars → ~1.1 × 10^21 combinations, brute-force infeasible
 */
const generateToken = customAlphabet(URL_ALPHABET, 12);

/**
 * Validate a candidate custom short code (user-supplied).
 * Only alphanumeric + hyphens, 3–20 chars.
 */
function validateCustomCode(code) {
  return /^[a-zA-Z0-9-]{3,20}$/.test(code);
}

module.exports = { generateShortCode, generateToken, validateCustomCode };
