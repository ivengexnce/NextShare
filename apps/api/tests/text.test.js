const request = require('supertest');
const app = require('../src/app');
const TextRepository = require('../src/modules/text/text.repository');

describe('Code Paste (Text) Module', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/pastes/meta/presets', () => {
    it('should return supported languages and expiry presets', async () => {
      const res = await request(app).get('/api/pastes/meta/presets');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.languages)).toBe(true);
      expect(res.body.data.languages).toContain('javascript');
      expect(res.body.data.languages).toContain('python');
      expect(Array.isArray(res.body.data.expiryPresets)).toBe(true);
    });
  });

  describe('POST /api/pastes (create paste)', () => {
    it('should reject requests with empty content (400)', async () => {
      const res = await request(app).post('/api/pastes').send({ content: '' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unsupported programming language (400)', async () => {
      const res = await request(app).post('/api/pastes').send({
        content: 'console.log("hi")',
        language: 'unsupported-language-xyz',
      });
      expect(res.status).toBe(400);
    });

    it('should create regular paste successfully (201)', async () => {
      const mockPaste = {
        shortCode: 'pst123',
        content: 'const a = 1;',
        language: 'javascript',
        title: 'Snippet',
        expiresAt: null,
        burnAfterRead: false,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(TextRepository, 'create').mockResolvedValue(mockPaste);

      const res = await request(app).post('/api/pastes').send({
        content: 'const a = 1;',
        language: 'javascript',
        title: 'Snippet',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toBe('pst123');
      expect(res.body.data.shareUrl).toContain('/paste/pst123');
    });
  });

  describe('GET /api/pastes/:code (retrieval & burn-after-read)', () => {
    it('should return paste content for existing active paste', async () => {
      const mockPaste = {
        shortCode: 'get123',
        content: 'print("hello")',
        language: 'python',
        title: 'Python Script',
        expiresAt: null,
        burnAfterRead: false,
        viewCount: 3,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(TextRepository, 'findByCode').mockResolvedValue(mockPaste);
      jest.spyOn(TextRepository, 'incrementViews').mockResolvedValue();

      const res = await request(app).get('/api/pastes/get123');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('print("hello")');
    });

    it('should return 404 when paste does not exist', async () => {
      jest.spyOn(TextRepository, 'findByCode').mockResolvedValue(null);

      const res = await request(app).get('/api/pastes/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PASTE_NOT_FOUND');
    });

    it('should return 410 when paste has expired', async () => {
      const expiredPaste = {
        shortCode: 'exp123',
        content: 'old',
        expiresAt: new Date(Date.now() - 60000), // in past
        burnAfterRead: false,
      };
      jest.spyOn(TextRepository, 'findByCode').mockResolvedValue(expiredPaste);

      const res = await request(app).get('/api/pastes/exp123');
      expect(res.status).toBe(410);
      expect(res.body.code).toBe('PASTE_EXPIRED');
    });

    it('should atomically burn paste on read when burnAfterRead is true', async () => {
      const burnPaste = {
        shortCode: 'burn123',
        content: 'super secret token',
        language: 'plaintext',
        title: 'Secret',
        expiresAt: null,
        burnAfterRead: true,
        viewCount: 0,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(TextRepository, 'findByCode').mockResolvedValue(burnPaste);
      jest.spyOn(TextRepository, 'findAndBurn').mockResolvedValue(burnPaste);
      jest.spyOn(TextRepository, 'destroy').mockResolvedValue();

      const res = await request(app).get('/api/pastes/burn123');
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('super secret token');
      expect(TextRepository.findAndBurn).toHaveBeenCalledWith('burn123');
    });
  });

  describe('POST /api/pastes/:code/burn (burn on close)', () => {
    it('should burn paste and return 200 OK', async () => {
      jest.spyOn(TextRepository, 'destroy').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app).post('/api/pastes/anycode/burn');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Paste burned');
      expect(TextRepository.destroy).toHaveBeenCalledWith('anycode');
    });
  });
});
