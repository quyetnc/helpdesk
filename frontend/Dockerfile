# Multi-stage Dockerfile for React SPA with Vite

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE_URL=http://localhost:3000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Build the app with the VITE_API_BASE_URL available to Vite
RUN VITE_API_BASE_URL=${VITE_API_BASE_URL} npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install serve and curl for health checks
RUN npm install -g serve && apk add --no-cache curl

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3100

# Health check using curl (lightweight)
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=60s \
  CMD curl -f http://localhost:3100 || exit 1

# Start production server
CMD ["serve", "-s", "dist", "-l", "3100"]
