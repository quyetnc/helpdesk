/**
 * User Service HTTP Client
 * Fetches user info (email, name) from user-service for notification purposes
 */

const logger = require('./logger');
const config = require('./config');

/**
 * Fetch user by ID from user-service
 * Non-blocking: returns null on any error
 * Passes X-User-Id and X-User-Role headers for service-to-service auth
 */
async function getUserById(userId, callerUserId, callerRole) {
  if (!userId) return null;
  if (!config.userService.url) return null;

  try {
    const url = `${config.userService.url}/users/${userId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': callerUserId,
        'X-User-Role': callerRole,
      },
    });

    if (!response.ok) {
      logger.warn('user_fetch_failed', {
        userId,
        statusCode: response.status,
      });
      return null;
    }

    const user = await response.json();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (err) {
    logger.warn('user_fetch_error', {
      userId,
      error: err.message,
    });
    return null;
  }
}

module.exports = {
  getUserById,
};
