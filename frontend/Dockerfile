# Production-Grade Multi-stage Dockerfile for MyBlogSpot Frontend (Next.js 15 Standalone)
# Ref: Knowledge_Base/Docker.md & Security.md

# ==========================================
# STAGE 1: Build standalone Next.js server
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Cache npm dependencies layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .
RUN mkdir -p /app/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==========================================
# STAGE 2: Minimal Node Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Upgrade base system packages and remove unused global npm/npx
RUN apk update && apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets & standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
