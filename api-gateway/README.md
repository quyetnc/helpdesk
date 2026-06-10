# API Gateway

Single entry point for all client requests. Validates JWT tokens and routes to downstream services.

## Overview

- **Language**: Node.js 20
- **Framework**: Express.js
- **Auth**: JWT (HS256, 24h expiry)
- **Routing**: http-proxy-middleware to downstream services
- **Port**: 3000

## Quick Start

```bash
npm install
npm run dev
```

Check health: `curl http://localhost:3000/health`

## Routing

### Public Routes (no auth required)
- `POST /auth/login` → user-service
- `POST /users/register` → user-service

### Protected Routes (JWT required, via Authorization header)
- `GET /users/*` → user-service
- `PATCH /users/:id` → user-service
- `GET/POST /tickets/*` → ticket-service
- `PATCH /tickets/:id/status` → ticket-service
- `PATCH /tickets/:id/assign` → ticket-service
- `POST/GET /tickets/:id/comments` → ticket-service

## Middleware

1. **JSON Parser**: Parse request bodies
2. **Request Logger**: Log method, path, status, duration
3. **JWT Middleware** (HEL-63): Validate token, extract userId + role, forward X-User-Id and X-User-Role headers
4. **Error Handler**: Standardized error responses

## Environment Variables

```
JWT_SECRET=dev-secret-key
USER_SERVICE_URL=http://user-service:3001
TICKET_SERVICE_URL=http://ticket-service:3002
PORT=3000
NODE_ENV=development
```

## Docker

```bash
docker build -t api-gateway:1.0.0 .
docker run -p 3000:3000 -e JWT_SECRET=key api-gateway:1.0.0
```

## Implementation Roadmap

- [ ] **HEL-63**: JWT Middleware & Token Validation
- [ ] **HEL-64**: API Gateway Routing & Proxy Configuration
- [ ] **HEL-66**: Docker Compose Integration ✅ (this file)

## Related

- **DOP-001**: Product scope
- **IRD-003**: API Gateway spec
- **user-service**: Authentication (PORT 3001)
- **ticket-service**: Ticket management (PORT 3002)
test-protection
