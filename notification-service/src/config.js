module.exports = {
  server: {
    port: process.env.PORT || 3003,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'ticket.events',
    queues: {
      ticketCreated: 'notifications.ticket_created',
      ticketAssigned: 'notifications.ticket_assigned',
      ticketStatusChanged: 'notifications.ticket_status_changed',
      ticketSLABreach: 'notifications.ticket_sla_breach',
      dlq: 'notifications.dlq',
    },
    routingKeys: {
      ticketCreated: 'ticket.created',
      ticketAssigned: 'ticket.assigned',
      ticketStatusChanged: 'ticket.status_changed',
      ticketSLABreach: 'ticket.sla_breach',
    },
    retryConfig: {
      maxAttempts: 3,
      delays: [5000, 25000, 125000], // 5s, 25s, 125s (exponential backoff)
    },
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@supporttickets.app',
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  },
};
