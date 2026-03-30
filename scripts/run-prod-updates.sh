#!/bin/sh
# Apply idempotent production updates on every deployment.
# Safe to run multiple times — only uses UPDATE statements.

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[prod-updates] ERROR: DATABASE_URL is not set, skipping."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/prod-updates.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "[prod-updates] No prod-updates.sql found, skipping."
  exit 0
fi

echo "[prod-updates] Applying production updates..."
psql "$DATABASE_URL" -f "$SQL_FILE"
echo "[prod-updates] Done."
