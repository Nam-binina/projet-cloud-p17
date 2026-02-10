const request = require('supertest');
const app = require('../src/app');
const { executeQuery, isPostgreSQLAvailable, closePool } = require('../src/config/postgresql');

describe('Auth API (PostgreSQL only)', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let agent;

  beforeAll(async () => {
    const pgOk = await isPostgreSQLAvailable();
    if (!pgOk) {
      return;
    }
    agent = request.agent(app);
  });

  afterAll(async () => {
    try {
      await executeQuery('DELETE FROM users WHERE email = $1', [testEmail]);
    } catch (e) {
      // ignore cleanup errors
    }
    await closePool();
  });

  test('register -> login -> refresh -> reset-password', async () => {
    const pgOk = await isPostgreSQLAvailable();
    if (!pgOk) return;

    const regRes = await agent.post('/api/register').send({ email: testEmail, password: testPassword });
    expect([201, 500]).toContain(regRes.status);

    const loginRes = await agent.post('/api/login').send({ email: testEmail, password: testPassword });
    expect(loginRes.status).toBe(200);

    const refreshRes = await agent.post('/api/token/refresh');
    expect(refreshRes.status).toBe(200);

    const resetRes = await agent.post('/api/reset-password').send({ email: testEmail });
    expect(resetRes.status).toBe(200);
  });
});
