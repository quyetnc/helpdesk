# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm i

# Copy source code
COPY src ./src

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine AS production

# Set environment to production
ENV NODE_ENV=production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy dependencies from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy package files
COPY --from=builder /build/package.json ./
COPY --from=builder /build/package-lock.json* ./

# Copy source code from builder
COPY --from=builder /build/src ./src

# Expose port
EXPOSE 3000

# Start application (no migrations needed for gateway)
CMD ["node", "src/index.js"]
