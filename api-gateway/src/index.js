/**
 * API Gateway main entry point
 * JWT validation + request routing to downstream services
 */

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config');
const logger = require('./logger');
const healthRouter = require('./routes/health');
const { validateJWT } = require('./middleware/jwt');
const { correlationIdMiddleware } = require('./middleware/correlationId');

const app = express();

// Middleware: CORS (allow requests from frontend) — MUST be before body parser
app.use(cors({
  // origin: process.env.FRONTEND_URL || 'http://localhost:3100',
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
}));

// Middleware: Correlation ID (before request logging)
app.use(correlationIdMiddleware);

// Middleware: request logging (before body parser for consistency, skip health checks)
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
      correlationId: req.correlationId,
      userId: req.user?.userId,
      role: req.user?.role,
    });
    originalEnd.apply(res, args);
  };

  next();
});

// Routes: Public health (no JWT required, no body parsing needed)
app.use('/health', healthRouter);

// Middleware: Parse JSON for all routes
app.use(express.json());

// Middleware: JWT validation for protected routes (per IRD-003-001)
app.use((req, res, next) => {
  // Public routes that bypass JWT validation
  const publicRoutes = ['/users/register', '/auth/login', '/health'];

  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // All other routes require valid JWT
  validateJWT(req, res, next);
});

// Routes: Protected (JWT required)
// Per IRD-003-002: Proxy to downstream services

// Proxy: /users/* → user-service:3001
app.use(
  '/users',
  createProxyMiddleware({
    target: config.services.userService,
    changeOrigin: true,
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
      // Forward the parsed body if present
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
      }
      proxyReq.end();
    },
    onError: (err, req, res) => {
      logger.error('proxy_error', {
        service: 'user-service',
        error: err.message,
        correlationId: req.correlationId,
      });
      res.status(503).json({
        error: true,
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    },
  })
);

// Proxy: /auth/* → user-service:3001 (for login endpoint)
app.use(
  '/auth',
  createProxyMiddleware({
    target: config.services.userService,
    changeOrigin: true,
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
      // Forward the parsed body if present
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
      }
      proxyReq.end();
    },
    onError: (err, req, res) => {
      logger.error('proxy_error', {
        service: 'user-service',
        error: err.message,
        correlationId: req.correlationId,
      });
      res.status(503).json({
        error: true,
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    },
  })
);

// Proxy: /tickets/* → ticket-service:3002
app.use(
  '/tickets',
  createProxyMiddleware({
    target: config.services.ticketService,
    changeOrigin: true,
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
      // Forward the parsed body if present
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
      }
      proxyReq.end();
    },
    onError: (err, req, res) => {
      console.error('Proxy error (ticket-service):', err.message);
      res.status(503).json({
        error: true,
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    },
  })
);

// Proxy: /comments/* → ticket-service:3002
app.use(
  '/comments',
  createProxyMiddleware({
    target: config.services.ticketService,
    changeOrigin: true,
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
      // Forward the parsed body if present
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
      }
      proxyReq.end();
    },
    onError: (err, req, res) => {
      console.error('Proxy error (ticket-service):', err.message);
      res.status(503).json({
        error: true,
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    },
  })
);

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

// Start server only if this module is run directly
if (require.main === module) {
  const PORT = config.server.port;
  app.listen(PORT, () => {
    logger.info('api_gateway_started', { port: PORT });
  });
}

module.exports = app;
