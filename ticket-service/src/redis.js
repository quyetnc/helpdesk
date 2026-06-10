/**
 * Redis client initialization and helpers
 * Used for SLA deadline caching
 */

const redis = require('redis');

let client = null;

async function initializeRedis() {
  if (client) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  client = redis.createClient({
    url: redisUrl,
  });

  client.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  try {
    await client.connect();
    console.log('✅ Redis client connected');
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    // Don't throw — allow app to run without cache
  }

  return client;
}

function getRedisClient() {
  if (!client) {
    // Return a mock client that does nothing if not initialized
    return {
      get: async () => null,
      set: async () => true,
    };
  }
  return client;
}

module.exports = {
  initializeRedis,
  getRedisClient,
};
