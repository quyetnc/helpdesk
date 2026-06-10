# user-service

User authentication and management service for the ProOps2026 Support Ticket System.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your actual DATABASE_URL and JWT_SECRET
```

### 3. Run Database Migration

```bash
npx prisma migrate deploy
```

### 4. Start the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The service will listen on the port specified in the `PORT` env var (default: 3001).

## Architecture

### Configuration

- **src/config.js** — Validates required env vars on startup (`DATABASE_URL`, `JWT_SECRET`)
- Exits with error code 1 if any required var is missing

### Routes

- **GET /health** — Health check (no auth required)
- **POST /users/register** — User registration with Zod validation (no auth required)
- **POST /auth/login** — User login (no auth required) — _not yet implemented_
- **GET /users** — List all users (ADMIN only) — _not yet implemented_
- **GET /users/:id** — Get user by ID (any auth) — _not yet implemented_
- **PATCH /users/:id** — Update user (role-based rules) — _not yet implemented_
- **DELETE /users/:id** — Deactivate user (ADMIN only) — _not yet implemented_

### Database

- **PostgreSQL 15** on `DATABASE_URL`
- Schema defined in **prisma/schema.prisma**
- Migrations in **prisma/migrations/**
- Run `npx prisma migrate deploy` on container startup

### Validation

All request bodies validated with **Zod** before business logic:

- Registration: email format + password minimum 8 chars
- Errors: `{ "error": true, "message": "...", "code": "..." }`

### Logging

Every HTTP request logged with:
- Method, path, status code, duration (ms)

### Error Format

```json
{
  "error": true,
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

## Development Notes

- **Never** commit `.env` files — use `.env.example`
- **Never** return `password_hash` in API responses
- All config from env vars — nothing hardcoded
- JWT validation happens at the api-gateway, not here
- Role stored in JWT payload — never re-fetch from DB

## Reference

- **Spec:** [IRD-001](../docs/irds/IRD-001.md) in the docs repo
- **Team:** quyet_nc (backend) + hao_nn (database/DevOps)
- **Stack:** Express + Prisma + Zod + bcrypt + jsonwebtoken
