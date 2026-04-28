#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Ecove — Production Deploy Script
# Works for both first deploy AND subsequent updates.
# Run: bash scripts/deploy.sh
# ═══════════════════════════════════════════════════════════
set -e

APP_DIR="/var/www/ecove"
LOG_DIR="/var/log/ecove"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     Ecove — Deploying to Production  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Guard: must run from app directory
cd "$APP_DIR"

# Guard: .env.local must exist
if [ ! -f ".env.local" ]; then
  echo "❌ ERROR: .env.local not found in $APP_DIR"
  echo "   Copy .env.example to .env.local and fill in your credentials."
  exit 1
fi

# Guard: DATABASE_URL must be set
if ! grep -q "^DATABASE_URL=" .env.local; then
  echo "❌ ERROR: DATABASE_URL not set in .env.local"
  exit 1
fi

echo "▶ [1/7] Installing dependencies..."
# Install all deps for the build (including devDeps needed by Next.js build)
npm install --no-audit --no-fund

echo "▶ [2/7] Generating Prisma client..."
npx prisma generate

echo "▶ [3/7] Running database migrations..."
npx prisma migrate deploy

echo "▶ [4/7] Building application..."
npm run build

echo "▶ [5/7] Copying static assets into standalone build..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "▶ [6/7] Creating log directory..."
mkdir -p "$LOG_DIR"

echo "▶ [7/7] Starting / reloading application..."
# startOrReload: starts if not running, reloads (zero-downtime) if already running
if pm2 describe ecove > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production --update-env
  echo "   Application reloaded with zero downtime ✅"
else
  pm2 start ecosystem.config.js --env production
  echo "   Application started ✅"
fi

pm2 save

echo ""
echo "✅ Deploy complete!"
echo "   Health check: curl http://localhost:3000/api/health"
echo "   Live logs:    pm2 logs ecove"
echo ""
