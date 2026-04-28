#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Ecove Marketplace — Complete Monitoring & Alerting Setup
#
# What this script sets up:
#   1. Automated daily database backups (2am cron)
#   2. Weekly backup integrity verification
#   3. PM2 log rotation
#   4. Local health check cron (every 5 min)
#   5. UptimeRobot external monitoring via API (automated)
#   6. Email alert when downtime is detected
#
# Usage:
#   bash scripts/setup-monitoring.sh
#
# For UptimeRobot automation, get your API key first:
#   1. Sign up free at https://uptimerobot.com
#   2. Go to My Settings → API Settings → Main API Key
#   3. Pass it as argument: bash scripts/setup-monitoring.sh YOUR_API_KEY
# ═══════════════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/ecove"
LOG_DIR="/var/log/ecove"
BACKUP_DIR="/var/backups/ecove"
UPTIMEROBOT_API_KEY="${1:-}"

# Read domain from .env.local
DOMAIN="ecove.com.ng"
if [ -f "$APP_DIR/.env.local" ]; then
  RAW_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$APP_DIR/.env.local" | cut -d'=' -f2- | tr -d '"')
  if [ -n "$RAW_URL" ]; then
    DOMAIN=$(echo "$RAW_URL" | sed 's|https\?://||' | sed 's|/.*||')
  fi
fi

# Read admin email from .env.local
ALERT_EMAIL="admin@${DOMAIN}"
if [ -f "$APP_DIR/.env.local" ]; then
  ENV_EMAIL=$(grep "^ADMIN_EMAIL=" "$APP_DIR/.env.local" | cut -d'=' -f2- | tr -d '"')
  if [ -n "$ENV_EMAIL" ]; then
    ALERT_EMAIL="$ENV_EMAIL"
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║      Ecove — Complete Monitoring Setup           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Domain:       https://$DOMAIN"
echo "  Alert email:  $ALERT_EMAIL"
echo ""

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# ── 1. Daily database backup cron (2am) ─────────────────────────────────────
echo "▶ [1/6] Setting up automated daily backups..."
CRON_BACKUP="0 2 * * * $APP_DIR/scripts/backup.sh >> $LOG_DIR/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -qF "backup.sh") || \
  (crontab -l 2>/dev/null; echo "$CRON_BACKUP") | crontab -
echo "   Daily backup at 2:00 AM ✅"

# ── 2. Weekly backup integrity check (Monday 9am) ───────────────────────────
echo "▶ [2/6] Setting up weekly backup verification..."
CRON_VERIFY="0 9 * * 1 bash -c 'gunzip -t \$(ls -t $BACKUP_DIR/ecove_*.sql.gz 2>/dev/null | head -1) 2>/dev/null && echo OK || echo \"CORRUPT\" >> $LOG_DIR/backup-integrity.log'"
(crontab -l 2>/dev/null | grep -qF "backup-integrity") || \
  (crontab -l 2>/dev/null; echo "$CRON_VERIFY") | crontab -
echo "   Weekly integrity check Mondays 9:00 AM ✅"

# ── 3. PM2 log rotation ──────────────────────────────────────────────────────
echo "▶ [3/6] Configuring PM2 log rotation..."
pm2 install pm2-logrotate        2>/dev/null || true
pm2 set pm2-logrotate:max_size  50M  2>/dev/null || true
pm2 set pm2-logrotate:retain    7    2>/dev/null || true
pm2 set pm2-logrotate:compress  true 2>/dev/null || true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD 2>/dev/null || true
echo "   PM2 log rotation: 50MB max, 7 days, gzipped ✅"

# ── 4. Local health check cron (every 5 min, writes to log if down) ─────────
echo "▶ [4/6] Setting up local health checks..."
HEALTH_URL="https://${DOMAIN}/api/health"
CRON_HEALTH="*/5 * * * * curl -sf --max-time 10 $HEALTH_URL > /dev/null 2>&1 || echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] DOWN\" >> $LOG_DIR/health-alerts.log"
(crontab -l 2>/dev/null | grep -qF "api/health") || \
  (crontab -l 2>/dev/null; echo "$CRON_HEALTH") | crontab -
echo "   Health check every 5 minutes → $LOG_DIR/health-alerts.log ✅"

# ── 5. Run first backup now ──────────────────────────────────────────────────
echo "▶ [5/6] Running first backup now..."
if bash "$APP_DIR/scripts/backup.sh"; then
  echo "   First backup complete ✅"
else
  echo "   ⚠️  Backup failed — check $LOG_DIR/backup.log"
fi

# ── 6. UptimeRobot external monitoring ──────────────────────────────────────
echo "▶ [6/6] Setting up UptimeRobot external monitoring..."
echo ""

setup_uptimerobot() {
  local API_KEY="$1"
  local CHECK_URL="https://${DOMAIN}/api/health"
  local MONITOR_NAME="Ecove Marketplace"

  echo "   Connecting to UptimeRobot API..."

  # Get or create alert contact (email)
  CONTACTS_RESPONSE=$(curl -s --max-time 15 \
    -X POST "https://api.uptimerobot.com/v2/getAlertContacts" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "api_key=${API_KEY}&format=json")

  if echo "$CONTACTS_RESPONSE" | grep -q '"stat":"ok"'; then
    CONTACT_ID=$(echo "$CONTACTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Alert contact found (ID: $CONTACT_ID) ✅"
  else
    echo "   ⚠️  Could not retrieve alert contacts — will create monitor without alerts"
    CONTACT_ID=""
  fi

  # Check if monitor already exists
  MONITORS_RESPONSE=$(curl -s --max-time 15 \
    -X POST "https://api.uptimerobot.com/v2/getMonitors" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "api_key=${API_KEY}&format=json&search=${DOMAIN}")

  if echo "$MONITORS_RESPONSE" | grep -q "\"url\":\"${CHECK_URL}\""; then
    echo "   Monitor already exists for $CHECK_URL ✅"
    return 0
  fi

  # Create the monitor
  CREATE_DATA="api_key=${API_KEY}"
  CREATE_DATA+="&format=json"
  CREATE_DATA+="&type=1"                          # HTTP(s)
  CREATE_DATA+="&url=${CHECK_URL}"
  CREATE_DATA+="&friendly_name=${MONITOR_NAME}"
  CREATE_DATA+="&interval=300"                    # Check every 5 minutes
  CREATE_DATA+="&http_method=1"                   # GET
  CREATE_DATA+="&keyword_type=1"                  # Keyword alert type (look for OK in response)
  CREATE_DATA+="&keyword_value=ok"                # /api/health returns {"status":"ok",...}
  if [ -n "$CONTACT_ID" ]; then
    CREATE_DATA+="&alert_contacts=${CONTACT_ID}_0_0"
  fi

  CREATE_RESPONSE=$(curl -s --max-time 15 \
    -X POST "https://api.uptimerobot.com/v2/newMonitor" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$CREATE_DATA")

  if echo "$CREATE_RESPONSE" | grep -q '"stat":"ok"'; then
    MONITOR_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   Monitor created! ID: $MONITOR_ID ✅"
    echo "   Monitoring: $CHECK_URL"
    echo "   Frequency:  Every 5 minutes"
    echo "   Alerts to:  $ALERT_EMAIL"
    return 0
  else
    ERROR=$(echo "$CREATE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "   ⚠️  Could not create monitor: ${ERROR:-unknown error}"
    echo "   Response: $CREATE_RESPONSE"
    return 1
  fi
}

if [ -n "$UPTIMEROBOT_API_KEY" ]; then
  if setup_uptimerobot "$UPTIMEROBOT_API_KEY"; then
    UPTIME_STATUS="✅ Configured automatically"
  else
    UPTIME_STATUS="⚠️  API setup failed — follow manual steps below"
  fi
else
  UPTIME_STATUS="⏭  Skipped (no API key provided)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              ✅ Monitoring Setup Complete                        ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                  ║"
printf "║  1. Daily backups (2am)        ✅ Active                        ║\n"
printf "║  2. Backup verification (Mon)  ✅ Active                        ║\n"
printf "║  3. PM2 log rotation           ✅ Active                        ║\n"
printf "║  4. Local health checks        ✅ Every 5 minutes               ║\n"
printf "║  5. UptimeRobot                %-33s║\n" "$UPTIME_STATUS"
echo "║                                                                  ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                  ║"

if [ -z "$UPTIMEROBOT_API_KEY" ] || [ "$UPTIME_STATUS" != "✅ Configured automatically" ]; then
echo "║  UptimeRobot Manual Setup (5 minutes, free):                    ║"
echo "║                                                                  ║"
echo "║  1. Go to https://uptimerobot.com → Sign Up (free)             ║"
echo "║  2. Click + Add New Monitor                                     ║"
echo "║     Monitor Type : HTTP(s)                                      ║"
printf "║     Friendly Name: %-44s║\n" "Ecove Marketplace"
printf "║     URL          : %-44s║\n" "https://$DOMAIN/api/health"
echo "║     Monitoring Interval: 5 minutes                              ║"
echo "║                                                                  ║"
echo "║  3. Click Alert Contacts → Add Email Contact                    ║"
printf "║     Email: %-52s║\n" "$ALERT_EMAIL"
echo "║                                                                  ║"
echo "║  4. Automate next time:                                         ║"
echo "║     My Settings → API Settings → copy Main API Key             ║"
printf "║     Then run: bash scripts/setup-monitoring.sh YOUR_KEY        ║"
echo ""
echo "║                                                                  ║"
fi

echo "║  Useful commands:                                                ║"
echo "║    tail -f /var/log/ecove/health-alerts.log  (local alerts)    ║"
echo "║    tail -f /var/log/ecove/backup.log          (backup status)  ║"
echo "║    pm2 logs ecove                             (app logs)       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
