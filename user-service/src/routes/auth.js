/**
 * Auth routes
 * POST /auth/login — no auth
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// Zod schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /auth/login
 * No authentication required
 * Validates credentials and returns JWT token
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Query user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // If user not found, return 401 (never reveal email existence)
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(
      validatedData.password,
      user.password_hash
    );

    // If password doesn't match, return 401 (same message as email not found)
    if (!passwordMatch) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate JWT token with userId and role
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return token and user (WITHOUT password_hash)
    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
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

    console.error('Login error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

module.exports = router;
