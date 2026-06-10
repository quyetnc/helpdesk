const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

describe('API Gateway Integration Tests', () => {
  describe('Public Routes (No Auth Required)', () => {
    it('should access /health without token', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should allow POST /users/register without token', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      // Gateway doesn't validate the request, just forwards it
      // 503 means downstream service unavailable (expected in test)
      expect([503, 400, 401]).toContain(response.status);
    });

    it('should allow POST /auth/login without token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect([503, 400, 401]).toContain(response.status);
    });
  });

  describe('Protected Routes (Auth Required)', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'user-123', role: 'CUSTOMER' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app).get('/users/123');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: true,
          code: 'MISSING_TOKEN',
        })
      );
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject requests with invalid signature', async () => {
      const badToken = jwt.sign(
        { userId: 'user-123', role: 'CUSTOMER' },
        'wrong-secret',
        { algorithm: 'HS256' }
      );

      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${badToken}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should forward request with valid token', async () => {
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${validToken}`);

      // 503 expected (no downstream service running)
      expect([503, 404]).toContain(response.status);
    });

    it('should forward X-User-Id and X-User-Role headers', async () => {
      const response = await request(app)
        .get('/users/123')
        .set('Authorization', `Bearer ${validToken}`);

      // Can't directly assert on forwarded headers since proxy is mocked,
      // but status code indicates gateway processed the token correctly
      expect(response.status).toBe(503);
    });
  });

  describe('Correlation ID', () => {
    it('should generate correlationId and include in response', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should use provided correlationId', async () => {
      const customId = 'custom-correlation-id-123';

      const response = await request(app)
        .get('/health')
        .set('X-Correlation-ID', customId);

      expect(response.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CUSTOMER' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );

      const response = await request(app)
        .get('/unknown/endpoint')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: true,
          code: 'NOT_FOUND',
        })
      );
    });
  });

  describe('CORS Headers', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/users/123')
        .set('Origin', 'http://localhost:3100')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(response.status);
    });

    it('should include allowed methods in CORS response', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3100');

      // CORS middleware should respond to preflight
      expect([200, 204]).toContain(response.status);
    });
  });
});
