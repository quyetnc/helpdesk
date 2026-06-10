/**
 * Comments routes
 * POST /comments — add comment to ticket
 * GET /comments/:ticket_id — get comments for ticket
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Zod schema
const createCommentSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID'),
  body: z.string().min(1, 'Comment body is required'),
});

/**
 * POST /comments
 * Add comment to ticket (any authenticated user)
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = createCommentSchema.parse(req.body);

    // Verify ticket exists and not deleted
    const ticket = await prisma.ticket.findUnique({
      where: { id: validatedData.ticket_id },
    });

    if (!ticket || ticket.is_deleted) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
        code: 'NOT_FOUND',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        ticket_id: validatedData.ticket_id,
        author_id: req.user.id,
        body: validatedData.body,
      },
      select: {
        id: true,
        ticket_id: true,
        author_id: true,
        body: true,
        created_at: true,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('POST /comments error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /comments/:ticket_id
 * Get comments for a ticket (any authenticated user)
 */
router.get('/:ticket_id', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Verify ticket exists and not deleted
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticket_id },
    });

    if (!ticket || ticket.is_deleted) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
        code: 'NOT_FOUND',
      });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          ticket_id: req.params.ticket_id,
          is_deleted: false,
        },
        select: {
          id: true,
          ticket_id: true,
          author_id: true,
          body: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({
        where: {
          ticket_id: req.params.ticket_id,
          is_deleted: false,
        },
      }),
    ]);

    res.json({
      data: comments,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('GET /comments/:ticket_id error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

module.exports = router;
