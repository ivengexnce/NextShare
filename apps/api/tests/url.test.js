const request = require('supertest');
const app = require('../src/app');
const UrlRepository = require('../src/modules/url/url.repository');

describe('URL Shortener Module', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/urls (create short link)', () => {
    it('should reject requests with missing originalUrl (400)', async () => {
      const res = await request(app).post('/api/urls').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid URI schemes like javascript: or ftp: (400)', async () => {
      const res = await request(app)
        .post('/api/urls')
        .send({ originalUrl: 'javascript:alert(1)' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid custom code with special characters (400)', async () => {
      const res = await request(app)
        .post('/api/urls')
        .send({ originalUrl: 'https://example.com', customCode: 'bad@code!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 if custom code is already taken', async () => {
      jest.spyOn(UrlRepository, 'codeExists').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/urls')
        .send({ originalUrl: 'https://example.com', customCode: 'taken123' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CODE_TAKEN');
    });

    it('should create short URL successfully (201)', async () => {
      const mockRecord = {
        shortCode: 'abc1234',
        originalUrl: 'https://example.com/test-article',
        title: 'Test Article',
        expiresAt: null,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(UrlRepository, 'codeExists').mockResolvedValue(false);
      jest.spyOn(UrlRepository, 'create').mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/urls')
        .send({ originalUrl: 'https://example.com/test-article', title: 'Test Article' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toBe('abc1234');
      expect(res.body.data.originalUrl).toBe('https://example.com/test-article');
      expect(res.body.data.shortUrl).toContain('abc1234');
    });
  });

  describe('GET /:code (redirect)', () => {
    it('should redirect (301) to original URL when short link is active', async () => {
      const mockUrl = {
        shortCode: 'active1',
        originalUrl: 'https://github.com/ivengence',
        expiresAt: null,
        clicks: 5,
      };
      jest.spyOn(UrlRepository, 'findByCode').mockResolvedValue(mockUrl);
      jest.spyOn(UrlRepository, 'incrementClicks').mockResolvedValue();

      const res = await request(app).get('/active1');
      expect(res.status).toBe(301);
      expect(res.header.location).toBe('https://github.com/ivengence');
    });

    it('should return 404 if short link does not exist', async () => {
      jest.spyOn(UrlRepository, 'findByCode').mockResolvedValue(null);

      const res = await request(app).get('/notfound99');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('URL_NOT_FOUND');
    });

    it('should return 410 if link has expired', async () => {
      const expiredUrl = {
        shortCode: 'expired1',
        originalUrl: 'https://example.com',
        expiresAt: new Date(Date.now() - 10000), // in the past
      };
      jest.spyOn(UrlRepository, 'findByCode').mockResolvedValue(expiredUrl);

      const res = await request(app).get('/expired1');
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('URL_EXPIRED');
    });
  });

  describe('GET /api/urls/:code/stats', () => {
    it('should return stats for existing link', async () => {
      const mockUrl = {
        shortCode: 'stat123',
        originalUrl: 'https://example.com/docs',
        title: 'Docs',
        clicks: 12,
        createdAt: new Date().toISOString(),
        expiresAt: null,
      };
      jest.spyOn(UrlRepository, 'findByCode').mockResolvedValue(mockUrl);

      const res = await request(app).get('/api/urls/stat123/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clicks).toBe(12);
      expect(res.body.data.originalUrl).toBe('https://example.com/docs');
    });

    it('should return 404 for stats of unknown link', async () => {
      jest.spyOn(UrlRepository, 'findByCode').mockResolvedValue(null);

      const res = await request(app).get('/api/urls/unknowncode/stats');
      expect(res.status).toBe(404);
    });
  });
});
