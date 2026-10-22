const request = require('supertest');
const app = require('../src/app');

describe('Health & Global Error Routing', () => {
  it('GET /health should return 200 OK with status and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('GET /unknown-route should return 404 Route not found', async () => {
    const res = await request(app).get('/non-existent-endpoint-abc123');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
  });
});
