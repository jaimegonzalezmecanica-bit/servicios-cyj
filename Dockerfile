# ─── Build stage ───
FROM node:20-slim AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy dependency files
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN bun install --frozen-lockfile 2>/dev/null || npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js in standalone mode
RUN npx next build

# Copy static assets to standalone output
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/

# ─── Production stage ───
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and ensure database directory exists
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Set DATABASE_URL to persistent location
ENV DATABASE_URL="file:/app/data/custom.db"

# Run database migration
RUN npx prisma db push --skip-generate 2>/dev/null || true

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/alerts', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]
