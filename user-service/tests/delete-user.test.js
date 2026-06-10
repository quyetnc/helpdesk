/**
 * DELETE /users/:id — soft deactivate
 * ADMIN only
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/index');
const config = require('../src/config');

const prisma = new PrismaClient();

function makeToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwt.secret, { expiresIn: '1h' });
}

async function createUser(overrides = {}) {
  const defaults = {
    email: `del-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test User',
    password_hash: await bcrypt.hash('password123', 12),
    role: 'CUSTOMER',
  };
  return prisma.user.create({ data: { ...defaults, ...overrides } });
}

let adminUser, customerUser;

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@example.com' } } });
  adminUser    = await createUser({ email: 'del-admin@example.com',    role: 'ADMIN' });
  customerUser = await createUser({ email: 'del-customer@example.com', role: 'CUSTOMER' });
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@example.com' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('DELETE /users/:id', () => {
  describe('Auth guards', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).delete(`/users/${customerUser.id}`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for CUSTOMER role', async () => {
      const token = makeToken(customerUser.id, 'CUSTOMER');
      const res = await request(app)
        .delete(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 403 for AGENT role', async () => {
      const agent = await createUser({ email: 'del-agent@example.com', role: 'AGENT' });
      const token = makeToken(agent.id, 'AGENT');
      const res = await request(app)
        .delete(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('AC: Admin soft-deactivates a user → 204 + is_active false in DB', () => {
    it('should return 204 with no body', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .delete(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should set is_active = false in the database', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      await request(app)
        .delete(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      const updated = await prisma.user.findUnique({
        where: { id: customerUser.id },
      });
      expect(updated.is_active).toBe(false);
    });

    it('should not hard-delete the record', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      await request(app)
        .delete(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      const stillExists = await prisma.user.findUnique({
        where: { id: customerUser.id },
      });
      expect(stillExists).not.toBeNull();
    });

    it('should allow ADMIN to deactivate themselves', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .delete(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
      const updated = await prisma.user.findUnique({ where: { id: adminUser.id } });
      expect(updated.is_active).toBe(false);
    });
  });

  describe('Not found', () => {
    it('should return 404 for non-existent user', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });
});
