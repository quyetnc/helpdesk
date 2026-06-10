/**
 * Tickets routes
 * POST /tickets — create ticket
 * GET /tickets — AGENT/ADMIN only
 * GET /tickets/my — CUSTOMER only
 * GET /tickets/overdue — AGENT/ADMIN only
 * GET /tickets/:id — any auth
 * PATCH /tickets/:id/assign — AGENT/ADMIN
 * PATCH /tickets/:id/status — any auth
 */

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { requireRole } = require('../middleware/auth');
const { getRedisClient } = require('../redis');
const { publishEvent } = require('../rabbitmq');
const { getUserById } = require('../userClient');
const logger = require('../logger');

const router = express.Router();
const prisma = new PrismaClient();

// Zod schemas
const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']),
  requester_id: z.string().uuid('Invalid requester ID'),
});

const assignTicketSchema = z.object({
  assignee_id: z.string().uuid('Invalid assignee ID'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED']),
});

// Helper: Calculate SLA deadline based on priority
function calculateSLADeadline(priority) {
  const now = new Date();
  const hoursMap = {
    URGENT: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 72,
  };
  const hours = hoursMap[priority] || 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

// Helper: Get SLA from cache or calculate
async function getSLADeadline(ticketId, priority) {
  const redis = getRedisClient();
  const cacheKey = `sla:${ticketId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Date(cached);
    }
  } catch (err) {
    console.warn('Redis get error:', err.message);
  }

  const deadline = calculateSLADeadline(priority);

  try {
    await redis.set(cacheKey, deadline.toISOString(), { EX: 24 * 60 * 60 });
  } catch (err) {
    console.warn('Redis set error:', err.message);
  }

  return deadline;
}

// Helper: Publish ticket event (non-blocking, swallows errors)
async function publishTicketEvent(routingKey, payload) {
  try {
    await publishEvent(routingKey, payload);
  } catch (err) {
    logger.warn('ticket_event_publish_failed', {
      routingKey,
      error: err.message,
    });
  }
}

/**
 * POST /tickets
 * Create a new ticket (any authenticated user as requester)
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = createTicketSchema.parse(req.body);

    // Calculate SLA deadline based on priority
    const sla_deadline = calculateSLADeadline(validatedData.priority);

    const ticket = await prisma.ticket.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        status: 'OPEN',
        requester_id: validatedData.requester_id,
        sla_deadline,
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        requester_id: true,
        assignee_id: true,
        sla_deadline: true,
        created_at: true,
      },
    });

    // Cache the SLA deadline
    const redis = getRedisClient();
    try {
      await redis.set(`sla:${ticket.id}`, sla_deadline.toISOString(), {
        EX: 24 * 60 * 60,
      });
    } catch (err) {
      console.warn('Redis cache error:', err.message);
    }

    // Publish ticket.created event (non-blocking)
    const requester = await getUserById(validatedData.requester_id, req.user.id, req.user.role);
    await publishTicketEvent('ticket.created', {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      requester_id: ticket.requester_id,
      requester_email: requester?.email ?? null,
      sla_deadline: ticket.sla_deadline,
      created_at: ticket.created_at,
    });

    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('POST /tickets error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /tickets
 * AGENT/ADMIN only — list all tickets with pagination
 */
router.get('/', requireRole('AGENT', 'ADMIN'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { is_deleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          requester_id: true,
          assignee_id: true,
          sla_deadline: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({ where: { is_deleted: false } }),
    ]);

    res.json({
      data: tickets,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('GET /tickets error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /tickets/my
 * CUSTOMER only — get own tickets
 */
router.get('/my', requireRole('CUSTOMER'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          requester_id: req.user.id,
          is_deleted: false,
        },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          requester_id: true,
          assignee_id: true,
          sla_deadline: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({
        where: { requester_id: req.user.id, is_deleted: false },
      }),
    ]);

    res.json({
      data: tickets,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('GET /tickets/my error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /tickets/overdue
 * AGENT/ADMIN only — get tickets past SLA deadline
 */
router.get('/overdue', requireRole('AGENT', 'ADMIN'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const now = new Date();

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          is_deleted: false,
          sla_deadline: { lt: now },
          status: { not: 'RESOLVED' }, // Exclude resolved tickets
        },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          requester_id: true,
          assignee_id: true,
          sla_deadline: true,
          created_at: true,
        },
        orderBy: { sla_deadline: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({
        where: {
          is_deleted: false,
          sla_deadline: { lt: now },
          status: { not: 'RESOLVED' },
        },
      }),
    ]);

    res.json({
      data: tickets,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('GET /tickets/overdue error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * GET /tickets/:id
 * Get ticket by ID (any authenticated user)
 */
router.get('/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        requester_id: true,
        assignee_id: true,
        sla_deadline: true,
        resolved_at: true,
        is_deleted: true,
        created_at: true,
      },
    });

    if (!ticket || ticket.is_deleted) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
        code: 'NOT_FOUND',
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('GET /tickets/:id error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * PATCH /tickets/:id/assign
 * AGENT/ADMIN: Assign ticket (Agent: self-assign only, Admin: any)
 */
router.patch('/:id/assign', requireRole('AGENT', 'ADMIN'), async (req, res) => {
  try {
    const validatedData = assignTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket || ticket.is_deleted) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
        code: 'NOT_FOUND',
      });
    }

    // Cannot assign RESOLVED or CLOSED tickets
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return res.status(400).json({
        error: true,
        message: `Cannot assign ${ticket.status} ticket`,
        code: 'INVALID_STATE',
      });
    }

    // Agent can only self-assign
    if (req.user.role === 'AGENT' && req.user.id !== validatedData.assignee_id) {
      return res.status(403).json({
        error: true,
        message: 'Agent can only self-assign tickets',
        code: 'FORBIDDEN',
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { assignee_id: validatedData.assignee_id },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        requester_id: true,
        assignee_id: true,
        sla_deadline: true,
        created_at: true,
      },
    });

    // Publish ticket.assigned event (non-blocking)
    const requester = await getUserById(ticket.requester_id, req.user.id, req.user.role);
    const assignee = await getUserById(validatedData.assignee_id, req.user.id, req.user.role);
    await publishTicketEvent('ticket.assigned', {
      id: updatedTicket.id,
      title: updatedTicket.title,
      assignee_id: updatedTicket.assignee_id,
      assignee_name: assignee?.name ?? null,
      requester_email: requester?.email ?? null,
    });

    res.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('PATCH /tickets/:id/assign error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * PATCH /tickets/:id/status
 * Update ticket status (any authenticated user)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket || ticket.is_deleted) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
        code: 'NOT_FOUND',
      });
    }

    // Status transition validation
    const validTransitions = {
      OPEN: ['IN_PROGRESS', 'ON_HOLD'],
      IN_PROGRESS: ['ON_HOLD', 'RESOLVED', 'CLOSED'],
      ON_HOLD: ['IN_PROGRESS', 'CLOSED'],
      RESOLVED: ['CLOSED'],
      CLOSED: [],
    };

    if (!validTransitions[ticket.status].includes(validatedData.status)) {
      return res.status(400).json({
        error: true,
        message: `Cannot transition from ${ticket.status} to ${validatedData.status}`,
        code: 'INVALID_STATE',
      });
    }

    // Auto-set resolved_at when status transitions to RESOLVED
    const updateData = { status: validatedData.status };
    if (validatedData.status === 'RESOLVED' && !ticket.resolved_at) {
      updateData.resolved_at = new Date();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        requester_id: true,
        assignee_id: true,
        sla_deadline: true,
        resolved_at: true,
        created_at: true,
      },
    });

    // Publish ticket.status_changed event when status transitions to RESOLVED (non-blocking)
    if (validatedData.status === 'RESOLVED') {
      const requester = await getUserById(updatedTicket.requester_id, req.user.id, req.user.role);
      await publishTicketEvent('ticket.status_changed', {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status,
        requester_email: requester?.email ?? null,
        resolved_at: updatedTicket.resolved_at,
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    console.error('PATCH /tickets/:id/status error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

module.exports = router;
