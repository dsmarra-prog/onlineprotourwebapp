#!/bin/sh
# Seed the database with initial data if it is empty.
# This script runs during the production build step.
# It is safe to run multiple times (idempotent: only inserts if tour_players is empty).

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[seed] ERROR: DATABASE_URL is not set, skipping seed."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_FILE="$SCRIPT_DIR/seed-prod.sql"

if [ ! -f "$SEED_FILE" ]; then
  echo "[seed] No seed file found at $SEED_FILE, skipping."
  exit 0
fi

COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM tour_players;" 2>/dev/null | tr -d ' ' || echo "error")

if [ "$COUNT" = "error" ] || [ -z "$COUNT" ]; then
  echo "[seed] Could not query tour_players, skipping seed."
  exit 0
fi

if [ "$COUNT" -gt "0" ]; then
  echo "[seed] Database already has $COUNT players, skipping seed."
  exit 0
fi

echo "[seed] Database is empty (0 players). Applying seed data..."
psql "$DATABASE_URL" -f "$SEED_FILE"
echo "[seed] Seed complete."
