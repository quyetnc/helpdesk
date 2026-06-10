# Notification Service

Event-driven notification engine with RabbitMQ, SendGrid, and Slack integration.

## Tech Stack

- **Message Broker:** RabbitMQ 3.12
- **Framework:** Express.js
- **Email:** SendGrid API
- **Chat:** Slack Webhooks
- **Container:** Docker (multi-stage)

## Project Structure

```
src/
├── index.js         # Express server + event consumer startup
├── config.js        # Configuration from env vars
├── rabbitmq.js      # RabbitMQ setup + exchange/queue declaration
├── consumer.js      # Event consumer + handlers
└── handlers/        # Event-specific handlers (email, Slack, retry logic)
```

## Features

### Event Processing
- **Topic Exchange:** `ticket.events` (durable)
- **Routing Keys:**
  - `ticket.created` → notifications.ticket_created
  - `ticket.assigned` → notifications.ticket_assigned
  - `ticket.status_changed` → notifications.ticket_status_changed
  - `ticket.sla_breach` → notifications.ticket_sla_breach

### Retry Logic
- **Max Attempts:** 3
- **Backoff:** 5s → 25s → 125s (exponential)
- **Dead Letter Queue:** notifications.dlq (7-day TTL)

### Notifications
1. **Email (SendGrid)** — ticket created, assigned, resolved
2. **Slack (Webhooks)** — team alerts, SLA breaches
3. **Retry & DLQ** — auto-retry with exponential backoff

## Setup

```bash
npm install
npm run dev       # Start with auto-reload
npm run test      # Run tests
```

## Environment Variables

Create `.env`:

```
NODE_ENV=development
PORT=3003
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@supporttickets.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx/xxxxx/xxxxx
```

## Docker

```bash
docker build -t notification-service .
docker run -e RABBITMQ_URL=amqp://guest:guest@localhost:5672 notification-service
```

## Development Notes

- Graceful shutdown on SIGTERM/SIGINT
- Structured JSON logging
- Health check endpoint: GET /health
