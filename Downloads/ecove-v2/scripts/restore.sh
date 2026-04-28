#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Ecove Marketplace — Database Restore Script
#
# Usage:
#   bash scripts/restore.sh /var/backups/ecove/ecove_20250101_020000.sql.gz
#
# WARNING: This will OVERWRITE the current database.
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/var/www/ecove"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: bash scripts/restore.sh <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lht /var/backups/ecove/ecove_*.sql.gz 2>/dev/null | head -10
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

DB_NAME="ecove_db"
DB_USER="ecove_user"

# Load password
if [ -f "$APP_DIR/.env.local" ]; then
  DB_URL=$(grep "^DATABASE_URL=" "$APP_DIR/.env.local" | cut -d'=' -f2- | tr -d '"')
  DB_PASS=$(echo "$DB_URL" | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
  export PGPASSWORD="$DB_PASS"
fi

echo "⚠️  WARNING: This will overwrite the current database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Stopping application..."
pm2 stop ecove 2>/dev/null || true

echo "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -h localhost -d "$DB_NAME" --no-password

echo "Running migrations to ensure schema is current..."
cd "$APP_DIR"
npx prisma migrate deploy

echo "Starting application..."
pm2 start ecove

echo "✅ Restore complete from: $BACKUP_FILE"
