# Multi-stage Dockerfile for production-ready backend

# Base stage with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Development dependencies for building
FROM base AS dev-dependencies
COPY package*.json ./
RUN npm ci --silent

# Build stage
FROM dev-dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# Create directories with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app/data /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["node", "dist/production-server.js"]