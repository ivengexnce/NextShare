const crypto = require('crypto');
const { customAlphabet } = require('nanoid');

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

/**
 * Timing-safe string comparison to mitigate side-channel timing attacks.
 */
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = crypto.createHash('sha256').update(a).digest();
  const bufB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Deterministic hash for tokens (e.g. delete tokens stored in DB).
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * Cryptographically secure password hashing using Scrypt.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a stored Scrypt hash with constant-time equality check.
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !password || typeof storedHash !== 'string') return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Compute SHA-256 hash of a buffer or stream for file integrity checksum.
 */
function hashFile(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  generateShortCode,
  generateToken,
  validateCustomCode,
  timingSafeCompare,
  hashToken,
  hashPassword,
  verifyPassword,
  hashFile,
};
