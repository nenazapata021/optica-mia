# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG AUTH_URL
ARG AUTH_SECRET
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV AUTH_URL=${AUTH_URL:-http://localhost:3000}
ENV AUTH_SECRET=${AUTH_SECRET}
RUN npx prisma generate
RUN npm run build

FROM deps AS dev
RUN apt-get update -y && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*
COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV APP_MODE=dev
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /home/nextjs && chown nextjs:nodejs /home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated ./src/generated
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && npm install --no-save \
    prisma@$(node -p "require('./package.json').devDependencies.prisma.replace('^','')") \
  && npm install -g \
    tsx@$(node -p "require('./package.json').devDependencies.tsx.replace('^','')") \
  && npm install --no-save \
    postgres-array@$(node -p "require('./node_modules/postgres-array/package.json').version") \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
