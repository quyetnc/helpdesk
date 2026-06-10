# user-service — Claude Context

## Quick Reference

**Service:** user-service (port 3001)  
**Spec:** Read `../docs/irds/IRD-001.md` in docs repo  
**Project:** Support Ticket System (ProOps2026)  
**Team:** quyet_nc · hao_nn

---

## Key Rules (from main CLAUDE.md)

### Tech Stack
- Runtime: Node.js 20 LTS
- Framework: Express
- ORM: Prisma
- Validation: Zod
- Auth: bcrypt (12 rounds) + jsonwebtoken (HS256, 24h)
- Database: PostgreSQL 15
- Testing: Jest + Supertest

### Service-Specific
- **user-service is the ONLY service that issues JWT** — no other service decodes JWT
- Role stored in JWT payload — never re-fetch from DB
- **NEVER return `password_hash` in any API response**
- Login with email not found → return 401 (not 404) — never reveal email existence
- All config from env vars — nothing hardcoded
- Zod validation before business logic
- Error format: `{ "error": true, "message": "...", "code": "..." }`
- Pagination: `{ "data": [...], "pagination": { "limit", "offset", "total" } }`

### Database
- `prisma migrate deploy` runs on container startup
- Users table: UUID PK, email unique, role enum (CUSTOMER/AGENT/ADMIN)
- Soft delete ready (is_active boolean)

### API Endpoints (per IRD-001)
- POST /users/register — no auth
- POST /auth/login — no auth
- GET /health — no auth
- GET /users — ADMIN only
- GET /users/:id — any auth
- PATCH /users/:id — rules by role
- DELETE /users/:id — ADMIN only, soft deactivate

### Testing
- Unit tests: business logic + Zod validation
- Integration tests: real PostgreSQL Docker
- Never mock the DB layer

### Git
- Branch format: `feat/US-XX-description`
- Commit format: `feat(user-service): add POST /users/register`
- PR required — partner reviews before merge

---

## How to Use Claude Code Here

1. Open Claude Code in this folder
2. Ask Claude to implement based on Linear issue + IRD-001
3. Claude auto-follows rules above
4. Review → commit → push → PR