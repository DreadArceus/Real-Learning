# Multi-stage Dockerfile for production-ready frontend

# Base stage with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat curl

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

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]