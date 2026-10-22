const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const FilesRepository = require('../src/modules/files/files.repository');
const { hashToken, hashPassword } = require('../src/shared/utils/hash');

describe('Files Module & BOLA / IDOR Security', () => {
  const config = require('../src/config');
  const uploadDir = path.resolve(config.upload.dir);
  const dummyFilePath = path.join(uploadDir, 'test-asset.txt');

  beforeAll(() => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(dummyFilePath, 'Hello NextShare security audit test content');
  });

  afterAll(() => {
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/files/upload', () => {
    it('should reject requests with no file attached (400)', async () => {
      const res = await request(app).post('/api/files/upload');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject file with dangerous or unpermitted extension (415)', async () => {
      const badFilePath = path.join(__dirname, 'payload.exe');
      fs.writeFileSync(badFilePath, 'binary-content');
      try {
        const res = await request(app)
          .post('/api/files/upload')
          .attach('file', badFilePath);
        expect(res.status).toBe(415);
      } finally {
        if (fs.existsSync(badFilePath)) fs.unlinkSync(badFilePath);
      }
    });

    it('should successfully upload valid file and return deleteToken (201)', async () => {
      const mockRecord = {
        shortCode: 'file123',
        originalName: 'test-asset.txt',
        size: 42,
        mimeType: 'text/plain',
        expiresAt: null,
        maxDownloads: null,
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(FilesRepository, 'findByCode').mockResolvedValue(null);
      jest.spyOn(FilesRepository, 'create').mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/files/upload')
        .attach('file', dummyFilePath);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toBe('file123');
      expect(res.body.data.deleteToken).toBeDefined();
      expect(typeof res.body.data.deleteToken).toBe('string');
      expect(res.body.data.deleteToken.length).toBeGreaterThan(10);
    });
  });

  describe('GET /api/files/:code/download (Security headers & password enforcement)', () => {
    it('should enforce security headers (nosniff and strict CSP) on download', async () => {
      const mockRecord = {
        shortCode: 'dl123',
        storedName: path.basename(dummyFilePath),
        originalName: 'test-asset.txt',
        mimeType: 'text/plain',
        size: 42,
        password: null,
        expiresAt: null,
        downloadCount: 0,
        maxDownloads: null,
      };
      jest.spyOn(FilesRepository, 'findByCodeWithPassword').mockResolvedValue(mockRecord);
      jest.spyOn(FilesRepository, 'incrementDownloads').mockResolvedValue();

      const res = await request(app).get('/api/files/dl123/download');
      expect(res.status).toBe(200);
      expect(res.header['x-content-type-options']).toBe('nosniff');
      expect(res.header['content-security-policy']).toBe("default-src 'none'");
      expect(res.header['content-disposition']).toContain('attachment;');
    });

    it('should return 401 when file has password and none or wrong password provided', async () => {
      const mockRecord = {
        shortCode: 'locked123',
        storedName: path.basename(dummyFilePath),
        originalName: 'secret.txt',
        mimeType: 'text/plain',
        size: 42,
        password: hashPassword('correctPassword123'),
        expiresAt: null,
        downloadCount: 0,
        maxDownloads: null,
      };
      jest.spyOn(FilesRepository, 'findByCodeWithPassword').mockResolvedValue(mockRecord);

      // No password provided
      const res1 = await request(app).get('/api/files/locked123/download');
      expect(res1.status).toBe(401);

      // Wrong password provided
      const res2 = await request(app)
        .get('/api/files/locked123/download')
        .set('x-file-password', 'wrongPassword');
      expect(res2.status).toBe(401);
    });

    it('should allow download when correct password is provided', async () => {
      const mockRecord = {
        shortCode: 'locked123',
        storedName: path.basename(dummyFilePath),
        originalName: 'secret.txt',
        mimeType: 'text/plain',
        size: 42,
        password: hashPassword('mySecretPass'),
        expiresAt: null,
        downloadCount: 0,
        maxDownloads: null,
      };
      jest.spyOn(FilesRepository, 'findByCodeWithPassword').mockResolvedValue(mockRecord);
      jest.spyOn(FilesRepository, 'incrementDownloads').mockResolvedValue();

      const res = await request(app)
        .get('/api/files/locked123/download')
        .set('x-file-password', 'mySecretPass');

      expect(res.status).toBe(200);
    });

    it('should return 410 when download limit is reached', async () => {
      const mockRecord = {
        shortCode: 'capped123',
        storedName: path.basename(dummyFilePath),
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 42,
        password: null,
        expiresAt: null,
        downloadCount: 5,
        maxDownloads: 5,
      };
      jest.spyOn(FilesRepository, 'findByCodeWithPassword').mockResolvedValue(mockRecord);

      const res = await request(app).get('/api/files/capped123/download');
      expect(res.status).toBe(410);
    });
  });

  describe('DELETE /api/files/:code (BOLA / IDOR Mitigation)', () => {
    const rawDeleteToken = 'valid-user-delete-token-abc123';
    const mockFileWithSecrets = {
      shortCode: 'del123',
      storedName: 'non-existent-test-file.txt',
      deleteTokenHash: hashToken(rawDeleteToken),
    };

    it('should block deletion without delete token (403 Forbidden)', async () => {
      jest.spyOn(FilesRepository, 'findByCodeWithSecrets').mockResolvedValue(mockFileWithSecrets);

      const res = await request(app).delete('/api/files/del123');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should block deletion with incorrect delete token (403 Forbidden)', async () => {
      jest.spyOn(FilesRepository, 'findByCodeWithSecrets').mockResolvedValue(mockFileWithSecrets);

      const res = await request(app)
        .delete('/api/files/del123')
        .set('x-delete-token', 'wrong-delete-token');
      expect(res.status).toBe(403);
    });

    it('should allow deletion with matching delete token (200 OK)', async () => {
      jest.spyOn(FilesRepository, 'findByCodeWithSecrets').mockResolvedValue(mockFileWithSecrets);
      jest.spyOn(FilesRepository, 'deactivate').mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .delete('/api/files/del123')
        .set('x-delete-token', rawDeleteToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('File deleted');
    });

    it('should allow deletion by administrator with valid x-admin-secret (200 OK)', async () => {
      jest.spyOn(FilesRepository, 'findByCodeWithSecrets').mockResolvedValue(mockFileWithSecrets);
      jest.spyOn(FilesRepository, 'deactivate').mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .delete('/api/files/del123')
        .set('x-admin-secret', 'test-admin-secret-key-12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
