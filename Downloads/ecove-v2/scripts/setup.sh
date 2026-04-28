#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Ecove Marketplace — First-Time Setup Script
#  Run: bash scripts/setup.sh
# ═══════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'; ORANGE='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${ORANGE}  ███████╗ ██████╗ ██████╗ ██╗   ██╗███████╗${NC}"
echo -e "${ORANGE}  ██╔════╝██╔════╝██╔═══██╗██║   ██║██╔════╝${NC}"
echo -e "${ORANGE}  █████╗  ██║     ██║   ██║██║   ██║█████╗  ${NC}"
echo -e "${ORANGE}  ██╔══╝  ██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ${NC}"
echo -e "${ORANGE}  ███████╗╚██████╗╚██████╔╝ ╚████╔╝ ███████╗${NC}"
echo -e "${ORANGE}  ╚══════╝ ╚═════╝ ╚═════╝   ╚═══╝  ╚══════╝${NC}"
echo ""
echo -e "${GREEN}  Ecove Marketplace — Setup Script${NC}"
echo "  ──────────────────────────────────────────────"
echo ""

# 1. Check Node
echo -e "${GREEN}[1/6]${NC} Checking Node.js…"
node_ver=$(node -v 2>/dev/null || echo "missing")
if [ "$node_ver" = "missing" ]; then
  echo -e "${RED}✗ Node.js not found. Install Node.js 20+ from nodejs.org${NC}"; exit 1
fi
echo "    ✓ Node.js $node_ver"

# 2. Env file
echo -e "${GREEN}[2/6]${NC} Checking environment…"
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "    ✓ .env.local created from .env.example"
  echo -e "    ${ORANGE}⚠  Edit .env.local with your real credentials before continuing!${NC}"
  echo ""
  echo "    Required fields to fill in:"
  echo "      DATABASE_URL — your PostgreSQL connection string"
  echo "      JWT_SECRET — any random 32+ character string"
  echo "      CLOUDINARY_* — from cloudinary.com dashboard"
  echo "      PAYSTACK_SECRET_KEY — from paystack.co dashboard"
  echo "      SMTP_* — your email server credentials"
  echo ""
  read -p "    Press Enter after you have filled in .env.local…"
else
  echo "    ✓ .env.local exists"
fi

# 3. Install dependencies
echo -e "${GREEN}[3/6]${NC} Installing dependencies…"
npm install
echo "    ✓ Dependencies installed"

# 4. Generate Prisma client
echo -e "${GREEN}[4/6]${NC} Generating Prisma client…"
npx prisma generate
echo "    ✓ Prisma client generated"

# 5. Run database migrations
echo -e "${GREEN}[5/6]${NC} Running database migrations…"
if [ "${NODE_ENV}" = "production" ]; then
  npx prisma migrate deploy
else
  # Dev: use migrate dev to create migration files
  npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma migrate deploy
fi
echo "    ✓ Migrations applied"

# 6. Seed database
echo -e "${GREEN}[6/6]${NC} Seeding database…"
npm run db:seed
echo "    ✓ Database seeded"

echo ""
echo "  ══════════════════════════════════════════════"
echo -e "  ${GREEN}✅ Setup complete! Start your server:${NC}"
echo ""
echo "    npm run dev"
echo ""
echo "  Admin login:"
echo "    URL:      http://localhost:3000/admin"
echo "    Email:    admin@ecove.com.ng"
echo "    Password: EcoveAdmin2025!"
echo ""
echo -e "  ${ORANGE}⚠  Change the admin password after first login!${NC}"
echo "  ══════════════════════════════════════════════"
echo ""
