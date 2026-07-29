#!/bin/sh
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-optica}"
POSTGRES_DB="${POSTGRES_DB:-optica_mia}"

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

cd /app

echo "Running migrations..."
npx --no-install prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running seed..."
  ./node_modules/.bin/tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped (tsx not available)"
fi

if [ "$APP_MODE" = "dev" ]; then
  if [ ! -d node_modules/next ]; then
    echo "Installing dependencies..."
    npm ci
  fi
  echo "Generating Prisma client..."
  npx --no-install prisma generate
  echo "Starting Next.js in development mode..."
  exec npm run dev -- --hostname 0.0.0.0 --port 3000
fi

echo "Starting Next.js in production mode..."
exec node server.js
