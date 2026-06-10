#!/bin/sh
# Entrypoint script for user-service
# Handles: DB readiness check → migrations → seeding → app startup
# Idempotent: Safe to run multiple times (uses upsert pattern)

set -o pipefail
trap 'echo "❌ Script error on line $LINENO"; exit 1' ERR

# ============================================================================
# Configuration
# ============================================================================
DB_HOST="${DB_HOST:-postgres-users-postgresql}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES=30
RETRY_DELAY=2

# ============================================================================
# Helper Functions
# ============================================================================
log_info() {
  echo "ℹ️  $1"
}

log_success() {
  echo "✓ $1"
}

log_warning() {
  echo "⚠️  $1"
}

log_error() {
  echo "❌ $1"
}

wait_for_db() {
  local host=$1
  local port=$2
  local max_retries=$3
  local retry=0

  log_info "Waiting for database at $host:$port..."

  while [ $retry -lt $max_retries ]; do
    if nc -z "$host" "$port" 2>/dev/null; then
      log_success "Database is ready!"
      return 0
    fi

    retry=$((retry + 1))
    if [ $((retry % 5)) -eq 0 ]; then
      log_info "  Attempt $retry/$max_retries - Retrying in ${RETRY_DELAY}s..."
    fi
    sleep $RETRY_DELAY
  done

  log_error "Database failed to become ready after $((max_retries * RETRY_DELAY)) seconds"
  return 1
}

run_migrations() {
  log_info "Running Prisma migrations..."

  if npx prisma migrate deploy 2>&1; then
    log_success "Migrations applied successfully"
    return 0
  else
    log_warning "Migrations skipped or already up to date"
    return 0
  fi
}

run_seeds() {
  log_info "Seeding database with initial data..."

  if npx prisma db seed 2>&1; then
    log_success "Database seeded successfully (using upsert - idempotent)"
    return 0
  else
    log_warning "Seeding skipped or data already exists (idempotent)"
    return 0
  fi
}

# ============================================================================
# Main Execution
# ============================================================================
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  USER-SERVICE Startup Sequence"
echo "════════════════════════════════════════════════════════════"
echo ""

# Wait for database
wait_for_db "$DB_HOST" "$DB_PORT" "$MAX_RETRIES" || exit 1

echo ""

# Run migrations (idempotent)
run_migrations || exit 1

echo ""

# Seed data (idempotent via upsert)
run_seeds || exit 1

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Database initialization complete"
echo "🚀 Starting application..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Start application (replace process, don't fork)
exec npm run dev
