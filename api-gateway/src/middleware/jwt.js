/**
 * JWT Validation Middleware
 * Per IRD-003-001: Validates JWT token and extracts user context
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to validate JWT token and extract user claims
 * Forwards X-User-Id and X-User-Role headers to downstream services
 */
function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // Step 1: Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: 'Missing authorization header',
      code: 'MISSING_TOKEN',
    });
  }

  // Step 2: Extract Bearer token
  const parts = authHeader.split(' ');
  if (parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({
      error: true,
      message: 'Invalid authorization header format',
      code: 'INVALID_TOKEN',
    });
  }

  const token = parts[1];

  try {
    // Step 3: Verify token signature using HS256
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    });

    // Step 4: Extract userId and role
    const userId = decoded.sub || decoded.userId;
    const role = decoded.role;

    if (!userId || !role) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token payload',
        code: 'INVALID_TOKEN',
      });
    }

    // Step 5: Attach user context to request for logging
    req.user = { userId, role };

    // Step 6: Forward headers to downstream services
    req.headers['X-User-Id'] = userId;
    req.headers['X-User-Role'] = role;

    next();
  } catch (err) {
    // Token verification failed (invalid signature, expired, malformed)
    console.warn(`JWT validation failed: ${err.message}`);
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
}

module.exports = { validateJWT };
