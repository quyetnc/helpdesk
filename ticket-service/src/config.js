/**
 * Configuration module
 * Validates required environment variables on startup
 */

const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

module.exports = {
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    exchange: process.env.RABBITMQ_EXCHANGE || 'ticket.events',
    routingKeys: {
      ticketCreated: 'ticket.created',
      ticketAssigned: 'ticket.assigned',
      ticketStatusChanged: 'ticket.status_changed',
      ticketSLABreach: 'ticket.sla_breach',
    },
  },
  userService: {
    url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  },
  server: {
    port: process.env.PORT || 3002,
  },
};
