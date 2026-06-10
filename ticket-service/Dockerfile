# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install all dependencies (including devDependencies for seed scripts)
RUN npm install --omit=optional

# Copy Prisma schema and seed
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine AS production

ENV NODE_ENV=development

WORKDIR /app

# Install curl for health checks, openssl3 for Prisma, and netcat for DB checks
RUN apk add --no-cache curl busybox-extras openssl3 netcat-openbsd

# Copy all dependencies from builder (including devDependencies for ts-node)
COPY --from=builder /build/node_modules ./node_modules

# Copy package files
COPY --from=builder /build/package.json ./
COPY --from=builder /build/package-lock.json* ./

# Copy Prisma schema, migrations, and seed scripts
COPY --from=builder /build/prisma ./prisma

# Copy source code from builder
COPY --from=builder /build/src ./src

# Copy and make entrypoint script executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Fix permissions: all app files must be owned by node user
# This is critical for Prisma to write to node_modules during migration
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Health check: verify API is responding
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=60s \
  CMD curl -f http://localhost:3002/health || exit 1

# Expose port
EXPOSE 3002

# Entry point: runs migrations → seeds → starts app
ENTRYPOINT ["/app/entrypoint.sh"]
