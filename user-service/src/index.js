/**
 * user-service main entry point
 * Express app with JWT auth, user management, and Prisma ORM
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const config = require('./config');
const logger = require('./logger');
const healthRouter = require('./routes/health');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const app = express();

// Middleware: CORS
app.use(cors());

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

// Middleware: extract user context from gateway headers (X-User-Id, X-User-Role)
// Attached by api-gateway after JWT validation
const { extractUser } = require('./middleware/auth');

// Routes: Public (no auth required)
app.use('/health', healthRouter);

// Middleware: extract user context for protected routes
// Skip for public routes: /health, /users/register, /auth/login
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/users/register' || req.path === '/auth/login') {
    return next();
  }
  extractUser(req, res, next);
});

// Routes: Protected (require user context)
app.use('/users', usersRouter);
app.use('/auth', authRouter);

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
  app.listen(PORT, () => {
    logger.info('user_service_started', { port: PORT });
  });
}

module.exports = app;
