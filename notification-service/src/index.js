/**
 * notification-service main entry point
 * Express app with RabbitMQ event consumer
 * Handles email, Slack, and retry logic for ticket notifications
 */

require('dotenv').config();

const express = require('express');
const config = require('./config');
const logger = require('./logger');
const { initializeRabbitMQ, closeConnection } = require('./rabbitmq');
const { startConsumer } = require('./consumer');

const app = express();

// Middleware: parse JSON
app.use(express.json());

// Middleware: request logging (skip health checks to reduce noise)
app.use((req, res, next) => {
  // Skip logging for health checks (K8s probes)
  if (req.path === '/health') {
    return next();
  }

  const startTime = Date.now();

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    logger.info('http_request_completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
    originalEnd.apply(res, args);
  };

  next();
});

// Routes: Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

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
  });
  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Start server only if this module is run directly
if (require.main === module) {
  const PORT = config.server.port;

  async function start() {
    try {
      // Initialize RabbitMQ
      await initializeRabbitMQ();

      // Start event consumer
      await startConsumer();

      // Start Express server
      app.listen(PORT, () => {
        logger.info('notification_service_started', { port: PORT });
        logger.info('event_consumer_running');
      });

      // Handle graceful shutdown
      process.on('SIGTERM', async () => {
        logger.info('sigterm_received_shutting_down');
        await closeConnection();
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        logger.info('sigint_received_shutting_down');
        await closeConnection();
        process.exit(0);
      });
    } catch (err) {
      logger.error('failed_to_start', { error: err.message, stack: err.stack });
      process.exit(1);
    }
  }

  start();
}

module.exports = app;
