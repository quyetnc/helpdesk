# Ticket Service

Ticket management service with SLA tracking, status lifecycle, comments, and Redis caching.

## Overview

- **Language**: Node.js 20 (TypeScript-ready)
- **Framework**: Express.js
- **Database**: PostgreSQL 15 (port 5433, database: `tickets_db`)
- **Cache**: Redis 7 (port 6379)
- **ORM**: Prisma
- **Validation**: Zod
- **Testing**: Jest + Supertest

## Quick Start

### Development

```bash
npm install
npm run dev
```

The service will start on `http://localhost:3002`

Check health: `curl http://localhost:3002/health`

### Testing

```bash
npm test          # Run all tests once
npm run test:watch # Watch mode
```

### Database Migrations

```bash
npx prisma migrate dev --name <migration_name>  # Create + apply migration
npx prisma migrate deploy                       # Apply pending migrations
npx prisma studio                               # Open Prisma Studio UI
```

## Endpoints (by Phase)

### Health Check
- `GET /health` → `{ status: "ok" }`

### Phase 1: Ticket CRUD (Sprint 2)
- `POST /tickets` — Create ticket (CUSTOMER only)
- `GET /tickets` — List all tickets (AGENT/ADMIN only)
- `GET /tickets/my` — List own tickets (CUSTOMER only)
- `GET /tickets/:id` — Get ticket details
- `PATCH /tickets/:id/status` — Update status with lifecycle validation
- `PATCH /tickets/:id/assign` — Self-assign ticket (AGENT only)

### Phase 2: Comments
- `POST /tickets/:id/comments` — Add comment
- `GET /tickets/:id/comments` — List comments
- `DELETE /tickets/:id/comments/:cid` — Soft delete comment

### Phase 3: Redis Caching
- Automatic SLA deadline caching (5-min TTL)
- Overdue ticket lookups via Redis

## Environment Variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tickets_db
REDIS_URL=redis://localhost:6379
PORT=3002
NODE_ENV=development
```

## Docker

```bash
# Build image
docker build -t ticket-service:1.0.0 .

# Run container (with external DB + Redis)
docker run -p 3002:3002 \
  -e DATABASE_URL=postgresql://postgres:postgres@db:5432/tickets_db \
  -e REDIS_URL=redis://redis:6379 \
  ticket-service:1.0.0
```

## Project Structure

```
ticket-service/
├── src/
│   ├── index.js           # Express app setup
│   ├── config.js          # Env var validation
│   └── routes/
│       ├── health.js      # Health endpoint
│       └── tickets.js     # Ticket endpoints (TBD)
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── tests/
│   └── tickets.test.js    # Integration tests
├── package.json
├── Dockerfile
└── .env.example
```

## Acceptance Criteria (Phase 1 — Sprint 2)

### HEL-57: Database Schema
- [ ] Tickets table with priority, status, SLA
- [ ] Comments table with soft delete
- [ ] Proper indexes on requester_id, assignee_id, status

### HEL-58: CRUD API
- [ ] POST /tickets: Create with auto-SLA
- [ ] GET /tickets: List all (AGENT/ADMIN only)
- [ ] GET /tickets/my: List own (CUSTOMER only)
- [ ] GET /tickets/:id: Get details

### HEL-59: SLA & Status Lifecycle
- [ ] SLA calculation: URGENT=4h, HIGH=8h, MEDIUM=24h, LOW=72h
- [ ] Status transitions: OPEN → IN_PROGRESS → ON_HOLD/RESOLVED → CLOSED
- [ ] resolved_at auto-set on RESOLVED

### HEL-60: Assignment & Status Updates
- [ ] PATCH /tickets/:id/assign: Self-assign only
- [ ] PATCH /tickets/:id/status: Enforce transitions

### HEL-61: Comments API
- [ ] POST /tickets/:id/comments: Create comment
- [ ] GET /tickets/:id/comments: List with pagination
- [ ] DELETE /tickets/:id/comments/:cid: Soft delete

### HEL-62: Redis Caching
- [ ] Cache SLA deadlines (5-min TTL)
- [ ] Fast overdue lookups

## Related Documentation

- **DOP-001**: Product scope + AC
- **IRD-002**: Ticket Service API spec
- **IRD-003**: API Gateway + Docker Compose

## Links

- Notion: [DOP-002 Ticket Service](https://notion.so/ticket-service)
- GitHub: [proops2026-helpdesk/ticket-service](https://github.com/proops2026-helpdesk/ticket-service)
