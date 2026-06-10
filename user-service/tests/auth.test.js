/**
 * Auth routes tests
 * Tests for POST /auth/login endpoint
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/index');
const config = require('../src/config');

const prisma = new PrismaClient();

// Test fixtures
const testUser = {
  email: 'test@example.com',
  password: 'SecurePassword123',
  name: 'Test User',
  role: 'CUSTOMER',
};

describe('POST /auth/login', () => {
  // Setup: Create test user before each test
  beforeEach(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create test user with hashed password
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        password_hash: passwordHash,
        role: testUser.role,
      },
    });
  });

  // Cleanup: Remove test user after each test
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe('AC-2: Correct credentials → 200 with token', () => {
    it('should return 200 with accessToken and user object on valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toEqual({
        id: expect.any(String),
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
    });

    it('should return a valid JWT token with userId and role in payload', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);

      // Decode token and verify payload
      const decoded = jwt.decode(res.body.accessToken);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role', testUser.role);
    });

    it('should not return password_hash in response', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(JSON.stringify(res.body)).not.toContain('password_hash');
    });

    it('should return token that can be verified with JWT_SECRET', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);

      // Verify token with secret
      const verified = jwt.verify(res.body.accessToken, config.jwt.secret);
      expect(verified).toHaveProperty('userId');
      expect(verified).toHaveProperty('role', testUser.role);
    });
  });

  describe('AC-3: Invalid credentials → 401', () => {
    it('should return 401 on wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: true,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should return 401 on email not found (same message as wrong password)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: true,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should never distinguish between missing email and wrong password', async () => {
      const wrongPasswordRes = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      const missingEmailRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(wrongPasswordRes.status).toBe(401);
      expect(missingEmailRes.status).toBe(401);
      expect(wrongPasswordRes.body.message).toBe(missingEmailRes.body.message);
      expect(wrongPasswordRes.body.code).toBe(missingEmailRes.body.code);
    });
  });

  describe('Validation errors → 400', () => {
    it('should return 400 on invalid email format', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: testUser.password,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
    });

    it('should return 400 on password too short', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
    });

    it('should return 400 on missing email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          password: testUser.password,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 on missing password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Token expiry', () => {
    it('should include expiresIn in token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);

      const decoded = jwt.decode(res.body.accessToken);
      expect(decoded).toHaveProperty('exp');
      // exp should be in the future
      expect(decoded.exp * 1000).toBeGreaterThan(Date.now());
    });
  });
});
