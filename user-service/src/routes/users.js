/**
 * Users routes
 * POST /users/register — no auth
 * GET /users — ADMIN only
 * GET /users/:id — any auth
 * PATCH /users/:id — rules by role
 * DELETE /users/:id — ADMIN only, soft deactivate
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Zod schema for GET /users query params
const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

// Zod schema for user registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

// Zod schema for user update
const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).optional(),
});

/**
 * POST /users/register
 * No authentication required
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: 'Email already registered',
        code: 'DUPLICATE_EMAIL',
      });
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user with default role CUSTOMER
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password_hash: passwordHash,
        name: validatedData.name,
        role: 'CUSTOMER',
      },
    });

    // Return user WITHOUT password_hash
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('Register error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /users
 * ADMIN only — list all users with pagination
 * Query params: limit (default 20), offset (default 0)
 */
router.get('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count(),
    ]);

    res.json({
      data: users,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /users/:id
 * Any authenticated user — get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('GET /users/:id error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * PATCH /users/:id
 * CUSTOMER/AGENT: can update own name only
 * ADMIN: can update any user's name and role
 */
router.patch('/:id', async (req, res) => {
  try {
    // Validate request body
    const validatedData = updateSchema.parse(req.body);

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    // Authorization rules
    const isOwnProfile = req.user.id === req.params.id;
    const isAdmin = req.user.role === 'ADMIN';

    // CUSTOMER/AGENT can only update own name
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        error: true,
        message: 'Cannot update other user profiles',
        code: 'FORBIDDEN',
      });
    }

    // CUSTOMER/AGENT cannot update role
    if (!isAdmin && validatedData.role) {
      return res.status(403).json({
        error: true,
        message: 'Cannot update user role',
        code: 'FORBIDDEN',
      });
    }

    // Build update data
    const updateData = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.role && isAdmin) updateData.role = validatedData.role;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('PATCH /users/:id error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * DELETE /users/:id
 * ADMIN only — soft deactivate user
 */
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    // Soft delete by setting is_active to false
    const deactivatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { is_active: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
      },
    });

    res.json(deactivatedUser);
  } catch (error) {
    console.error('DELETE /users/:id error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

module.exports = router;
