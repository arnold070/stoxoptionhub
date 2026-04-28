#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Ecove — Fresh VPS Server Setup Script
# Run ONCE on a brand-new Ubuntu 22.04 VPS as root:
#   bash scripts/server-setup.sh
# ═══════════════════════════════════════════════════════════
set -e

DOMAIN="ecove.com.ng"
APP_DIR="/var/www/ecove"
LOG_DIR="/var/log/ecove"
BACKUP_DIR="/var/backups/ecove"
DB_NAME="ecove_db"
DB_USER="ecove_user"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Ecove — VPS Server Setup         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Verify running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root. Use: sudo bash scripts/server-setup.sh"
  exit 1
fi

# Verify Ubuntu 22.04
if ! grep -q "22.04" /etc/os-release 2>/dev/null; then
  echo "⚠️  Warning: This script is tested on Ubuntu 22.04. Your OS may differ."
fi

# ── 1. System update ─────────────────────────────────────────────────────────
echo "▶ [1/11] Updating system packages..."
apt-get update -qq
# Only upgrade security patches — skip kernel upgrades that need a reboot
apt-get upgrade -y -qq --with-new-pkgs
apt-get install -y -qq curl wget unzip gnupg2 ca-certificates lsb-release
echo "   System updated ✅"

# ── 2. Swap file (critical for 2GB RAM servers) ───────────────────────────────
echo "▶ [2/11] Setting up 2GB swap file..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10'           >> /etc/sysctl.conf
  echo 'vm.vfs_cache_pressure=50'   >> /etc/sysctl.conf
  sysctl -p > /dev/null
  echo "   2GB swap created ✅"
else
  echo "   Swap already exists ✅"
fi

# ── 3. Install Node.js 20 ─────────────────────────────────────────────────────
echo "▶ [3/11] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
apt-get install -y nodejs -qq
echo "   Node.js $(node -v) installed ✅"

# ── 4. Install PostgreSQL 15 ──────────────────────────────────────────────────
echo "▶ [4/11] Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib -qq
systemctl enable postgresql
systemctl start postgresql
# Wait for PostgreSQL to be ready
for i in $(seq 1 10); do
  sudo -u postgres pg_isready -q && break
  sleep 1
done
echo "   PostgreSQL installed ✅"

# ── 5. Install Redis ──────────────────────────────────────────────────────────
echo "▶ [5/11] Installing Redis..."
apt-get install -y redis-server -qq
# Configure Redis to use less memory — important on 2GB servers
sed -i 's/# maxmemory <bytes>/maxmemory 128mb/'      /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl enable redis-server
systemctl restart redis-server
# Wait for Redis
for i in $(seq 1 10); do
  redis-cli ping 2>/dev/null | grep -q PONG && break
  sleep 1
done
echo "   Redis installed (128MB limit) ✅"

# ── 6. Install Nginx ──────────────────────────────────────────────────────────
echo "▶ [6/11] Installing Nginx..."
apt-get install -y nginx -qq
# Nginx worker optimisation for 1-core server
sed -i 's/worker_processes auto/worker_processes 1/' /etc/nginx/nginx.conf
systemctl enable nginx
systemctl start nginx
echo "   Nginx installed ✅"

# ── 7. Install Certbot ────────────────────────────────────────────────────────
echo "▶ [7/11] Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx -qq
echo "   Certbot installed ✅"

# ── 8. Install PM2 ────────────────────────────────────────────────────────────
echo "▶ [8/11] Installing PM2..."
npm install -g pm2 2>&1 | tail -1
if ! command -v pm2 &>/dev/null; then
  echo "❌ PM2 install failed. Check npm and try: npm install -g pm2"
  exit 1
fi
echo "   PM2 $(pm2 -v) installed ✅"

# ── 9. Create PostgreSQL database ─────────────────────────────────────────────
echo "▶ [9/11] Creating database..."
DB_PASS=$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"     2>/dev/null || echo "   (user already exists)"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"           2>/dev/null || echo "   (database already exists)"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME" > /root/db-credentials.txt
chmod 600 /root/db-credentials.txt
echo "   Database created. Credentials → /root/db-credentials.txt ✅"

# ── 10. Create directories ────────────────────────────────────────────────────
echo "▶ [10/11] Creating directories..."
mkdir -p "$APP_DIR" "$LOG_DIR" "$BACKUP_DIR"
echo "   Directories created ✅"

# ── 11. Firewall + backup cron ────────────────────────────────────────────────
echo "▶ [11/11] Configuring firewall and backup schedule..."
apt-get install -y ufw -qq
ufw allow OpenSSH     2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true
ufw --force enable    2>/dev/null || true
echo "   Firewall configured ✅"

# Daily backup cron at 2am
CRON_LINE="0 2 * * * $APP_DIR/scripts/backup.sh >> $LOG_DIR/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -qF "backup.sh") || \
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
echo "   Daily backup at 2:00 AM scheduled ✅"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                ✅ Server Setup Complete                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  DATABASE_URL saved to: /root/db-credentials.txt        ║"
echo "║  SWAP:    2GB created (prevents OOM crashes)            ║"
echo "║  REDIS:   128MB memory limit configured                 ║"
echo "║                                                          ║"
cat /root/db-credentials.txt | sed 's/^/║  /'
echo "                                                          ║"
echo "║                                                          ║"
echo "║  Next steps:                                            ║"
echo "║  1. Upload app:   scp ecove-vps-ready.zip root@IP:/var/www/" 
echo "║  2. Extract:      cd /var/www && unzip ecove-vps-ready.zip && mv ecove-production-full ecove"
echo "║  3. Configure:    cp /var/www/ecove/.env.example /var/www/ecove/.env.local"
echo "║                   nano /var/www/ecove/.env.local"
echo "║  4. Deploy:       bash /var/www/ecove/scripts/deploy.sh  ║"
echo "║  5. Monitoring:   bash /var/www/ecove/scripts/setup-monitoring.sh"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
