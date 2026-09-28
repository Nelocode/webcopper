#!/bin/sh
# Seed script for Easypanel deploy - runs on first container start
set -e

DB_PATH="/app/prisma/dev.db"

if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
    echo "Database exists, skipping seed."
else
    echo "Seeding fresh database..."
    npx prisma migrate deploy
    echo "Database ready."
fi
