/**
 * Auth middleware for ticket-service
 * Extracts user context from gateway-forwarded headers (X-User-Id, X-User-Role)
 * Per DOP-003: Gateway validates JWT, services trust headers
 */

/**
 * Extract authenticated user from X-User-Id and X-User-Role headers
 * Attached by api-gateway after JWT validation
 */
function extractUser(req, res, next) {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!userId || !role) {
    return res.status(401).json({
      error: true,
      message: 'Missing user context headers',
      code: 'MISSING_USER_CONTEXT',
    });
  }

  req.user = {
    id: userId,
    role: role.toUpperCase(),
  };

  next();
}

/**
 * Check if user has required role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Missing user context',
        code: 'MISSING_USER_CONTEXT',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

module.exports = { extractUser, requireRole };
