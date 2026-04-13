# ─── Build stage ───
FROM node:18-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npx next build

RUN cp -r .next/static .next/standalone/.next/
RUN cp -r public .next/standalone/

# ─── Production stage ───
FROM node:18-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/custom.db"

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3000/api/server-info || exit 1

CMD ["node", "server.js"]
