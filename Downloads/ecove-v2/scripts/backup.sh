#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Ecove Marketplace — Automated Database Backup Script
#
# Backs up PostgreSQL to a local directory and optionally to
# Cloudflare R2 / AWS S3 / Backblaze B2.
#
# Setup (run as root on the VPS):
#   1. Make executable: chmod +x /var/www/ecove/scripts/backup.sh
#   2. Test it: bash /var/www/ecove/scripts/backup.sh
#   3. Schedule it: crontab -e
#      Add this line for daily backup at 2am:
#      0 2 * * * /var/www/ecove/scripts/backup.sh >> /var/log/ecove/backup.log 2>&1
#
# Optional S3/R2 setup:
#   apt install awscli -y
#   aws configure  (enter your S3/R2 credentials)
#   Set S3_BUCKET below to your bucket name
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
APP_DIR="/var/www/ecove"
BACKUP_DIR="/var/backups/ecove"
LOG_PREFIX="[BACKUP $(date '+%Y-%m-%d %H:%M:%S')]"

# Database settings (reads from .env.local automatically)
DB_NAME="ecove_db"
DB_USER="ecove_user"

# How many days to keep local backups
RETENTION_DAYS=7

# S3-compatible storage (optional)
# Set to your bucket: "s3://my-bucket/ecove-backups" or "s3://r2-bucket/ecove-backups"
# Leave empty to skip cloud upload
S3_BUCKET=""

# ── Load DATABASE_URL from .env.local ────────────────────────────────────────
if [ -f "$APP_DIR/.env.local" ]; then
  DB_URL=$(grep "^DATABASE_URL=" "$APP_DIR/.env.local" | cut -d'=' -f2- | tr -d '"')
  if [ -n "$DB_URL" ]; then
    # Parse password from URL
    DB_PASS=$(echo "$DB_URL" | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
    export PGPASSWORD="$DB_PASS"
  fi
fi

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Create backup filename with timestamp ─────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/ecove_${TIMESTAMP}.sql.gz"

echo "$LOG_PREFIX Starting backup..."

# ── Run pg_dump ───────────────────────────────────────────────────────────────
# Use a temp file to detect pg_dump failure independently of gzip
TEMP_SQL=$(mktemp /tmp/ecove_backup_XXXXXX.sql)

pg_dump \
  -U "$DB_USER" \
  -h localhost \
  -d "$DB_NAME" \
  --no-password \
  --format=plain \
  --clean \
  --if-exists \
  > "$TEMP_SQL"

PGDUMP_EXIT=$?
if [ $PGDUMP_EXIT -ne 0 ] || [ ! -s "$TEMP_SQL" ]; then
  rm -f "$TEMP_SQL"
  echo "$LOG_PREFIX ERROR: pg_dump failed (exit $PGDUMP_EXIT) or produced empty output" >&2
  exit 1
fi

gzip -9 < "$TEMP_SQL" > "$BACKUP_FILE"
rm -f "$TEMP_SQL"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "$LOG_PREFIX Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Upload to S3/R2 (optional) ────────────────────────────────────────────────
if [ -n "$S3_BUCKET" ]; then
  if command -v aws &> /dev/null; then
    echo "$LOG_PREFIX Uploading to $S3_BUCKET..."
    aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/$(basename $BACKUP_FILE)" \
      --storage-class STANDARD_IA \
      --quiet
    echo "$LOG_PREFIX Upload complete ✅"
  else
    echo "$LOG_PREFIX WARNING: S3_BUCKET set but 'aws' CLI not installed. Run: apt install awscli -y"
  fi
fi

# ── Delete old local backups ──────────────────────────────────────────────────
echo "$LOG_PREFIX Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "ecove_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "ecove_*.sql.gz" | wc -l)
echo "$LOG_PREFIX $REMAINING backup(s) retained locally"

# ── Verify backup is readable ─────────────────────────────────────────────────
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "$LOG_PREFIX Backup integrity verified ✅"
else
  echo "$LOG_PREFIX ERROR: Backup file is corrupted!" >&2
  exit 1
fi

echo "$LOG_PREFIX Backup complete ✅"
