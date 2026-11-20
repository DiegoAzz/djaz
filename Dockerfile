# ==========================================
# Production Multi-Stage Dockerfile for Coolify
# Domain: djaz.appzplay.online
# ==========================================

# 1. Base dependencies stage
FROM node:22-alpine AS deps
WORKDIR /app

# Copy root workspace and package manifests
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all workspace dependencies (hoisted to /app/node_modules)
RUN npm ci

# 2. Builder stage for Web and API
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build both API and Web
ENV NODE_ENV=production
RUN npm run build

# 3. Production Runner Stage (Single unified container)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root manifests
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy hoisted production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled backend code
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy compiled frontend SPA static assets to /app/web-dist
COPY --from=builder /app/apps/web/dist ./web-dist

# Expose Coolify application port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start the unified server
CMD ["node", "apps/api/dist/index.js"]
