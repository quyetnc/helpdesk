/**
 * ticket-service main entry point
 * Express app with ticket management, SLA tracking, comments, and Redis caching
 */

require('dotenv').config();

const express = require('express');
const config = require('./config');
const logger = require('./logger');
const healthRouter = require('./routes/health');
const ticketsRouter = require('./routes/tickets');
const commentsRouter = require('./routes/comments');
const { extractUser } = require('./middleware/auth');

const app = express();

// Middleware: parse JSON
app.use(express.json());

// Middleware: Extract correlation ID from headers
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || 'unknown';
  next();
});

// Middleware: request logging (skip health checks to reduce noise)
app.use((req, res, next) => {
  // Skip logging for health checks (K8s probes)
  if (req.path === '/health') {
    return next();
  }

  const startTime = Date.now();

  // Capture the original res.end to log after response is sent
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    logger.info('http_request_completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      correlationId: req.correlationId,
      userId: req.user?.id,
      role: req.user?.role,
    });
    originalEnd.apply(res, args);
  };

  next();
});

// Routes: Public (no auth required)
app.use('/health', healthRouter);

// Middleware: extract user context from gateway headers (X-User-Id, X-User-Role)
// Attached by api-gateway after JWT validation
app.use((req, res, next) => {
  // Skip user extraction for public routes
  if (req.path === '/health') {
    return next();
  }
  extractUser(req, res, next);
});

// Routes: Protected (require user context)
app.use('/tickets', ticketsRouter);
app.use('/comments', commentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Not Found',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('unhandled_error', {
    error: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
  });
  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Start server only if this module is run directly (not imported for testing)
if (require.main === module) {
  const PORT = config.server.port;
  const { initializeRedis } = require('./redis');
  const { initializeRabbitMQ, closeConnection } = require('./rabbitmq');

  // Initialize Redis connection (non-blocking)
  initializeRedis().catch((err) => {
    logger.warn('redis_initialization_skipped', { error: err.message });
  });

  // Initialize RabbitMQ connection (non-blocking)
  initializeRabbitMQ().catch((err) => {
    logger.warn('rabbitmq_initialization_skipped', { error: err.message });
  });

  const server = app.listen(PORT, () => {
    logger.info('ticket_service_started', { port: PORT });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('sigterm_received_shutting_down');
    await closeConnection();
    server.close(() => {
      logger.info('ticket_service_shutdown_complete');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('sigint_received_shutting_down');
    await closeConnection();
    server.close(() => {
      logger.info('ticket_service_shutdown_complete');
      process.exit(0);
    });
  });
}

module.exports = app;
