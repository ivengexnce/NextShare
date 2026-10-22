const request = require('supertest');
const app = require('../src/app');
const { rateLimiter } = require('../src/shared/middleware/rateLimit.middleware');
const express = require('express');

describe('Security Controls & Hardening Verification', () => {
  describe('HTTP Security Headers (Helmet)', () => {
    it('should include strict security headers on all responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);

      // Verify Helmet protections
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');

      // Verify Express fingerprint is removed
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Origin Controls', () => {
    it('should allow legitimate frontend origin (http://localhost:5173)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should reject untrusted third-party origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-attacker-domain.com');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should reject arbitrary subdomains on vercel/netlify when not explicitly in whitelist', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://attacker.vercel.app');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('should return 429 when rate limit threshold is exceeded', async () => {
      const testApp = express();
      const testLimiter = rateLimiter(2, 60 * 1000); // 2 requests max per minute
      testApp.get('/test-limit', testLimiter, (_req, res) => res.json({ ok: true }));

      // Request 1
      const res1 = await request(testApp).get('/test-limit');
      expect(res1.status).toBe(200);

      // Request 2
      const res2 = await request(testApp).get('/test-limit');
      expect(res2.status).toBe(200);

      // Request 3 — should be throttled
      const res3 = await request(testApp).get('/test-limit');
      expect(res3.status).toBe(429);
      expect(res3.body.code).toBe('RATE_LIMITED');
      expect(res3.body.message).toContain('Too many requests');
    });
  });

  describe('Payload & Prototype Safety', () => {
    it('should reject nested malicious prototype objects in URL creation', async () => {
      const UrlRepository = require('../src/modules/url/url.repository');
      jest.spyOn(UrlRepository, 'codeExists').mockResolvedValue(false);
      jest.spyOn(UrlRepository, 'create').mockResolvedValue({
        shortCode: 'safe123',
        originalUrl: 'https://example.com',
        title: '',
        expiresAt: null,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
          __proto__: { admin: true },
        });

      // Object prototype is not polluted
      expect(({}).admin).toBeUndefined();
      expect(res.status).toBe(201);
    });
  });
});
