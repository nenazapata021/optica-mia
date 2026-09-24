#!/bin/sh
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-optica}"
POSTGRES_DB="${POSTGRES_DB:-optica_mia}"

wait_for_db() {
  echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
  until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
    sleep 2
  done
  echo "PostgreSQL is ready."
}

migrate() {
  cd /app
  wait_for_db
  echo "Running migrations..."
  npx --no-install prisma migrate deploy
  if [ "$RUN_SEED" = "true" ]; then
    echo "Running seed..."
    tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped (tsx not available)"
  fi
}

dev() {
  cd /app
  wait_for_db
  if [ ! -d node_modules/next ]; then
    echo "Installing dependencies..."
    npm ci
  fi
  echo "Generating Prisma client..."
  npx --no-install prisma generate
  echo "Starting Next.js in development mode..."
  exec npm run dev -- --hostname 0.0.0.0 --port 3000
}

if [ "$1" = "migrate" ] || [ "$2" = "migrate" ] || [ "$3" = "migrate" ]; then
  migrate
  exit 0
fi

if [ "$APP_MODE" = "dev" ]; then
  dev
fi

echo "Starting Next.js production server..."
exec node server.js