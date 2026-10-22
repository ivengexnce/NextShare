const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { timingSafeCompare } = require('../src/shared/utils/hash');

describe('Admin Module & Authorization Tests', () => {
  beforeEach(() => {
    const mockQuery = () => ({
      lean: () => ({
        limit: () => Promise.resolve([]),
      }),
    });
    jest.spyOn(mongoose, 'model').mockReturnValue({
      find: mockQuery,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /admin/stats authentication', () => {
    it('should reject request without x-admin-secret header (401)', async () => {
      const res = await request(app).get('/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should reject request with incorrect x-admin-secret header (401)', async () => {
      const res = await request(app)
        .get('/admin/stats')
        .set('x-admin-secret', 'incorrect-secret-guess');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow access and return statistics with valid x-admin-secret (200)', async () => {
      const res = await request(app)
        .get('/admin/stats')
        .set('x-admin-secret', 'test-admin-secret-key-12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totals).toBeDefined();
      expect(Array.isArray(res.body.data.urls)).toBe(true);
      expect(Array.isArray(res.body.data.pastes)).toBe(true);
      expect(Array.isArray(res.body.data.files)).toBe(true);
    });
  });

  describe('Timing-safe secret verification helper', () => {
    it('should return true for matching secrets', () => {
      expect(timingSafeCompare('secret-key-123', 'secret-key-123')).toBe(true);
    });

    it('should return false for mismatched secrets of equal length', () => {
      expect(timingSafeCompare('secret-key-123', 'secret-key-999')).toBe(false);
    });

    it('should return false for mismatched secrets of different lengths without throwing', () => {
      expect(timingSafeCompare('short', 'much-longer-secret-key')).toBe(false);
    });

    it('should safely handle non-string inputs', () => {
      expect(timingSafeCompare(null, 'secret')).toBe(false);
      expect(timingSafeCompare(undefined, undefined)).toBe(false);
    });
  });
});
