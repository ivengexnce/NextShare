process.env.NODE_ENV = 'test';
process.env.ADMIN_SECRET = 'test-admin-secret-key-12345';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const mockMemoryCache = new Map();

jest.mock('../src/config/redis', () => ({
  client: {
    sAdd: jest.fn().mockResolvedValue(1),
    sCard: jest.fn().mockResolvedValue(42),
    connect: jest.fn().mockResolvedValue(),
    quit: jest.fn().mockResolvedValue(),
    on: jest.fn(),
  },
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  get: jest.fn(async (key) => (mockMemoryCache.has(key) ? mockMemoryCache.get(key) : null)),
  set: jest.fn(async (key, value) => { mockMemoryCache.set(key, value); }),
  del: jest.fn(async (key) => { mockMemoryCache.delete(key); }),
  incr: jest.fn(async (key) => {
    const next = (mockMemoryCache.get(key) || 0) + 1;
    mockMemoryCache.set(key, next);
    return next;
  }),
}));

// Suppress noisy logger output during tests
jest.mock('../src/shared/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

afterEach(() => {
  mockMemoryCache.clear();
});
