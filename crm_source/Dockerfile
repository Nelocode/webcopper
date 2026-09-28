FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Copy the lean seed DB for fresh deploys
# (built from local dev.db before docker build)
# Verify seed DB exists
RUN test -f prisma/dev.seed.db || (echo 'ERROR: dev.seed.db not found' && exit 1)

# --- Production image ---
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

EXPOSE 80

ENV DATABASE_URL="file:./dev.db"
ENV PORT=80
ENV NODE_ENV=production

CMD ["sh", "-c", "\
  if [ ! -f prisma/dev.db ]; then \
    if [ -f prisma/dev.seed.db ]; then \
      cp prisma/dev.seed.db prisma/dev.db && \
      echo 'Seeded from dev.seed.db'; \
    else \
      npx prisma db push && \
      echo 'Created fresh database'; \
    fi; \
  fi; \
  npx prisma migrate deploy && \
  node dist/index.js \
"]
