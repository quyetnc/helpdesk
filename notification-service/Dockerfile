# Multi-stage Dockerfile for notification-service

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm i --only=production

# Copy source code from builder
COPY --from=builder /app/src ./src

# Install curl for health checks
RUN apk add --no-cache curl

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start service
CMD ["node", "src/index.js"]
