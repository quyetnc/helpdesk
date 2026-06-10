/**
 * Correlation ID Middleware
 * Generates or forwards X-Correlation-ID for request tracing across services
 */

const { randomUUID } = require('crypto');

/**
 * Generate or forward correlation ID
 * If request has X-Correlation-ID header, use it
 * Otherwise generate a new UUID
 * Attach to req.correlationId for logging
 * Add to response headers for client reference
 */
function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();

  req.correlationId = correlationId;

  // Forward in response headers for client reference
  res.setHeader('x-correlation-id', correlationId);

  next();
}

module.exports = { correlationIdMiddleware };
