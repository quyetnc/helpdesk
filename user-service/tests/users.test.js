/**
 * Users routes tests
 * GET /users          — ADMIN only
 * GET /users/:id      — any authenticated
 * PATCH /users/:id    — rules by role
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/index');
const config = require('../src/config');

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwt.secret, { expiresIn: '1h' });
}

async function createUser(overrides = {}) {
  const defaults = {
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test User',
    password_hash: await bcrypt.hash('password123', 12),
    role: 'CUSTOMER',
  };
  return prisma.user.create({ data: { ...defaults, ...overrides } });
}

// ── Shared fixtures ────────────────────────────────────────────────────────────

let adminUser, agentUser, customerUser;

beforeEach(async () => {
  // Clean slate — delete all test users by a known email pattern
  await prisma.user.deleteMany({ where: { email: { contains: '@example.com' } } });

  adminUser    = await createUser({ email: 'admin@example.com',    role: 'ADMIN' });
  agentUser    = await createUser({ email: 'agent@example.com',    role: 'AGENT' });
  customerUser = await createUser({ email: 'customer@example.com', role: 'CUSTOMER' });
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@example.com' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── GET /users ─────────────────────────────────────────────────────────────────

describe('GET /users', () => {
  describe('Auth guards', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer not.a.valid.token');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for CUSTOMER role', async () => {
      const token = makeToken(customerUser.id, 'CUSTOMER');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 403 for AGENT role', async () => {
      const token = makeToken(agentUser.id, 'AGENT');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('AC-9: Admin lists users → 200 with pagination shape', () => {
    it('should return 200 with data array and pagination', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        limit: expect.any(Number),
        offset: expect.any(Number),
        total: expect.any(Number),
      });
    });

    it('should return all 3 seeded users in the list', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Assert all 3 seeded users appear (DB may have pre-existing rows)
      const ids = res.body.data.map((u) => u.id);
      expect(ids).toContain(adminUser.id);
      expect(ids).toContain(agentUser.id);
      expect(ids).toContain(customerUser.id);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('should return correct user shape (no password_hash)', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      for (const user of res.body.data) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActive');
        expect(user).toHaveProperty('createdAt');
        expect(user).not.toHaveProperty('password_hash');
      }
    });
  });

  describe('Pagination', () => {
    it('should respect ?limit', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users?limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should respect ?offset', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');

      // First get total without pagination
      const allRes = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      const total = allRes.body.pagination.total;

      const res = await request(app)
        .get('/users?limit=2&offset=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.offset).toBe(2);
      expect(res.body.pagination.total).toBe(total);
      // With limit=2, offset=2: remaining = total - 2, capped at 2
      expect(res.body.data.length).toBe(Math.min(2, Math.max(0, total - 2)));
    });

    it('should return 400 when limit exceeds max (100)', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users?limit=101')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Filters', () => {
    it('should filter by ?role=ADMIN', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users?role=ADMIN')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Our seeded admin must appear; all returned users must be ADMIN
      const ids = res.body.data.map((u) => u.id);
      expect(ids).toContain(adminUser.id);
      res.body.data.forEach((u) => expect(u.role).toBe('ADMIN'));
    });

    it('should filter by ?isActive=true', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users?isActive=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // All returned users must be active; our 3 seeded users must appear
      res.body.data.forEach((u) => expect(u.isActive).toBe(true));
      const ids = res.body.data.map((u) => u.id);
      expect(ids).toContain(adminUser.id);
      expect(ids).toContain(agentUser.id);
      expect(ids).toContain(customerUser.id);
    });

    it('should filter by ?isActive=false', async () => {
      // Deactivate one user directly in DB
      await prisma.user.update({
        where: { id: customerUser.id },
        data: { is_active: false },
      });

      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .get('/users?isActive=false')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].isActive).toBe(false);
    });
  });
});

// ── GET /users/:id ─────────────────────────────────────────────────────────────

describe('GET /users/:id', () => {
  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/users/${customerUser.id}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 for CUSTOMER accessing any user', async () => {
    const token = makeToken(customerUser.id, 'CUSTOMER');
    const res = await request(app)
      .get(`/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'ADMIN',
    });
  });

  it('should return 200 for ADMIN accessing any user', async () => {
    const token = makeToken(adminUser.id, 'ADMIN');
    const res = await request(app)
      .get(`/users/${customerUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(customerUser.id);
  });

  it('should not return password_hash', async () => {
    const token = makeToken(adminUser.id, 'ADMIN');
    const res = await request(app)
      .get(`/users/${customerUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  it('should return 404 for non-existent user id', async () => {
    const token = makeToken(adminUser.id, 'ADMIN');
    const res = await request(app)
      .get('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });
});

// ── PATCH /users/:id ───────────────────────────────────────────────────────────

describe('PATCH /users/:id', () => {
  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/users/${customerUser.id}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  describe('CUSTOMER/AGENT rules', () => {
    it('should allow CUSTOMER to update own name', async () => {
      const token = makeToken(customerUser.id, 'CUSTOMER');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.id).toBe(customerUser.id);
    });

    it('should allow AGENT to update own name', async () => {
      const token = makeToken(agentUser.id, 'AGENT');
      const res = await request(app)
        .patch(`/users/${agentUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Agent Updated' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Agent Updated');
    });

    it('AC-9: CUSTOMER trying to change own role → 403', async () => {
      const token = makeToken(customerUser.id, 'CUSTOMER');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 403 when CUSTOMER edits another user', async () => {
      const token = makeToken(customerUser.id, 'CUSTOMER');
      const res = await request(app)
        .patch(`/users/${agentUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sneaky Change' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should return 403 when AGENT edits another user', async () => {
      const token = makeToken(agentUser.id, 'AGENT');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sneaky Change' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('ADMIN rules', () => {
    it('should allow ADMIN to update name of any user', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Admin Changed Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Admin Changed Name');
    });

    it('should allow ADMIN to change role of any user', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'AGENT' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('AGENT');
    });

    it('should allow ADMIN to update both name and role together', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Promoted', role: 'AGENT' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Promoted');
      expect(res.body.role).toBe('AGENT');
    });

    it('should return 404 when target user does not exist', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Response shape', () => {
    it('should never return password_hash', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Safe Update' });

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password_hash');
      expect(JSON.stringify(res.body)).not.toContain('password_hash');
    });
  });

  describe('Validation errors → 400', () => {
    it('should return 400 when name is empty string', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when role is not a valid enum value', async () => {
      const token = makeToken(adminUser.id, 'ADMIN');
      const res = await request(app)
        .patch(`/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SUPERUSER' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
