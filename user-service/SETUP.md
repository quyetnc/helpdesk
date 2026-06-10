# Development Environment Setup

Quick start guide to get user-service running locally with PostgreSQL and Node.js.

## Prerequisites

- **Node.js** 20+ (verify: `node --version`)
- **npm** 10+ (comes with Node.js)
- **Docker** and **Docker Compose** (verify: `docker --version` and `docker-compose --version`)
- **Git** (for cloning and version control)

## 3-Command Quick Start

```bash
# 1. Start PostgreSQL in Docker
docker-compose -f docker-compose.dev.yml up -d

# 2. Copy environment config
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

That's it! Service runs on http://localhost:3001

---

## Detailed Setup Instructions

### Step 1: Clone and Install Dependencies

```bash
cd user-service
npm install
```

This installs all dependencies listed in `package.json`:
- express (web framework)
- @prisma/client (database ORM)
- zod (validation)
- bcrypt (password hashing)
- jsonwebtoken (JWT auth)

### Step 2: Start PostgreSQL Database

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**What this does:**
- Pulls PostgreSQL 15 Alpine image (lightweight, ~60MB)
- Creates a container named `users_db_dev`
- Exposes port 5432 locally
- Creates persistent volume `postgres_users_data`
- Starts health check (runs `pg_isready` every 10s)

**Verify it's running:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

Expected output:
```
NAME            STATUS              PORTS
users_db_dev    Up 1 minute         5432/tcp
```

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and verify (or adjust if needed):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
```

**Why `.env.local`?**
- Never commit `.env` files to git
- `.env.local` is in `.gitignore` — safe for local secrets

### Step 4: Initialize Database Schema

```bash
npx prisma migrate deploy
```

This creates the `users` table based on the schema in `prisma/schema.prisma`.

**If it's the first time:**
```bash
npx prisma migrate dev --name init
```

This generates the migration and applies it in one step.

### Step 5: Start the Dev Server

```bash
npm run dev
```

Expected output:
```
✅ user-service listening on port 3001
```

The `--watch` flag auto-restarts on file changes.

---

## Testing

### Health Check (No Auth Required)

```bash
curl http://localhost:3001/health
```

Expected: `{ "status": "ok" }`

### Register a User

```bash
curl -X POST http://localhost:3001/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"MyPassword123"}'
```

Expected: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "role": "CUSTOMER"
}
```

### Verify Database

Connect to PostgreSQL:
```bash
docker exec -it users_db_dev psql -U postgres -d users_db
```

Then in psql:
```sql
SELECT id, email, role, is_active FROM users;
```

Exit: `\q`

---

## Stopping Services

**Stop the database** (keeps data in volume):
```bash
docker-compose -f docker-compose.dev.yml down
```

**Stop and remove all data** (clean slate):
```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## Troubleshooting

### "Connection refused" when starting npm dev

**Problem:** Database isn't ready yet.

**Solution:**
```bash
# Wait for health check to pass
docker-compose -f docker-compose.dev.yml logs postgres
```

Look for: `database system is ready to accept connections`

If not ready, wait 10 seconds and try `npm run dev` again.

---

### "Database already exists" or migration errors

**Problem:** Old migration state.

**Solution:**
```bash
# Clean slate
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# Wait for health check, then re-apply migrations
npx prisma migrate deploy
```

---

### "EADDRINUSE: Address already in use :::3001"

**Problem:** Another service is using port 3001.

**Solution:**
```bash
# Find and kill the process
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Or change PORT in .env.local to 3002, 3003, etc.
```

---

### "password authentication failed"

**Problem:** Wrong DATABASE_URL or database credentials.

**Solution:**
- Check `.env.local` matches `docker-compose.dev.yml`:
  - User: `postgres`
  - Password: `postgres`
  - Database: `users_db`
  - Host: `localhost`
  - Port: `5432`

---

### "Prisma client not generated"

**Problem:** `@prisma/client` not installed or generated.

**Solution:**
```bash
npm install
npx prisma generate
```

---

## Development Workflow

### Making Database Schema Changes

1. Edit `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name describe_change`
3. Commit both the schema and the migration file
4. Your partner pulls and runs: `npx prisma migrate deploy`

### Running Tests

```bash
npm test
```

(Test setup coming in Sprint 2)

### Stopping and Restarting

```bash
# Just restart the dev server
Ctrl+C, then npm run dev

# Restart everything
docker-compose -f docker-compose.dev.yml restart
npm run dev
```

---

## Next Steps

- Read [README.md](README.md) for API overview
- Check [IRD-001](../docs/irds/IRD-001.md) for full API spec
- Start implementing endpoints per your Linear tickets

Happy coding! 🚀
