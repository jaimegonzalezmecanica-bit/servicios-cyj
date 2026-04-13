# ─── Build stage ───
FROM node:20-alpine AS builder
WORKDIR /app

# Install openssl for prisma
RUN apk add --no-cache openssl

# Install bun
RUN npm install -g bun

# Copy dependency files
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN bun install --frozen-lockfile 2>/dev/null || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js in standalone mode
RUN npx next build

# Copy static assets to standalone output
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/ && \
    cp -r node_modules/.prisma .next/standalone/node_modules/.prisma && \
    cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/client && \
    mkdir -p .next/standalone/prisma && \
    cp prisma/schema.prisma .next/standalone/prisma/

# ─── Production stage ───
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/custom.db"

# Create non-root user
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Ensure data directory exists
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/server-info', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Prisma + SQLite auto-creates tables on first query
CMD ["node", "server.js"]
