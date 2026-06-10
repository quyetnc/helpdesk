/**
 * Register route tests
 * Tests for POST /users/register endpoint
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/index');

const prisma = new PrismaClient();

const testUser = {
  email: 'register-test@example.com',
  password: 'SecurePassword123',
  name: 'Register Test User',
};

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: testUser.email },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /users/register', () => {
  describe('AC: Valid data → 201', () => {
    it('should return 201 with user object on valid input', async () => {
      const res = await request(app).post('/users/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        email: testUser.email,
        name: testUser.name,
        role: 'CUSTOMER',
      });
      expect(res.body).toHaveProperty('id');
    });

    it('should never return password_hash in response', async () => {
      const res = await request(app).post('/users/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty('password_hash');
      expect(JSON.stringify(res.body)).not.toContain('password_hash');
    });

    it('should default role to CUSTOMER', async () => {
      const res = await request(app).post('/users/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('CUSTOMER');
    });
  });

  describe('AC: Duplicate email → 409', () => {
    it('should return 409 when email is already registered', async () => {
      // First registration
      await request(app).post('/users/register').send(testUser);

      // Second registration with same email
      const res = await request(app).post('/users/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: true,
        message: 'Email already registered',
        code: 'DUPLICATE_EMAIL',
      });
    });
  });

  describe('Validation errors → 400', () => {
    it('should return 400 on invalid email format', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
    });

    it('should return 400 on password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ ...testUser, password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
    });

    it('should return 400 on missing name', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 on missing email', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ password: testUser.password, name: testUser.name });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 on missing password', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ email: testUser.email, name: testUser.name });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});