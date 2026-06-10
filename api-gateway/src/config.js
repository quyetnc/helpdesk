/**
 * API Gateway Configuration
 * Validates required environment variables on startup
 */

const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    ticketService: process.env.TICKET_SERVICE_URL || 'http://ticket-service:3002',
  },
  server: {
    port: process.env.PORT || 3000,
  },
};
