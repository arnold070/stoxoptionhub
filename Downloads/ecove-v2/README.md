# 🛒 Ecove Marketplace — Full-Stack Next.js Application

**Nigeria's multi-vendor eCommerce marketplace** built with Next.js 14, PostgreSQL (Prisma), Paystack payments, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | JWT (HTTP-only cookies) |
| **Styling** | Tailwind CSS |
| **State** | Zustand (cart) + TanStack Query |
| **Payments** | Paystack + Flutterwave |
| **Images** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Forms** | React Hook Form + Zod |

---

## Quick Start

```bash
# 1. Copy env file and fill in your values
cp .env.example .env.local

# 2. Install, migrate, seed — all in one
bash scripts/setup.sh

# 3. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
src/
├── app/
│   ├── (storefront)/        # Homepage, products, search, checkout, store pages
│   ├── (auth)/register/     # Customer registration
│   ├── admin/               # Admin dashboard (protected, admin role)
│   ├── vendor/              # Vendor dashboard, register, login (protected)
│   └── api/
│       ├── auth/            # Login, register, vendor-register, JWT, email verify
│       ├── storefront/      # Public products, categories, vendors, search
│       ├── vendor/          # Vendor products, orders, payouts, profile
│       ├── admin/           # Admin vendors, products, orders, payouts, analytics
│       ├── checkout/        # Order creation + Paystack init
│       ├── payments/        # Payment verify
│       ├── webhooks/        # Paystack webhook (HMAC verified)
│       └── upload/          # Cloudinary image upload
├── lib/
│   ├── prisma.ts            # Prisma singleton
│   ├── auth.ts              # JWT helpers + requireAuth()
│   ├── api.ts               # ok(), paginated(), apiError() helpers
│   ├── commission.ts        # Commission rate resolver
│   ├── email.ts             # All transactional emails (nodemailer)
│   ├── cloudinary.ts        # Image upload/delete
│   ├── apiClient.ts         # Axios instance with interceptors
│   ├── rateLimit.ts         # In-memory rate limiter
│   └── utils.ts             # slugify, generateOrderNumber, etc.
├── context/
│   ├── AuthContext.tsx      # Global auth (login/logout/refresh)
│   └── QueryProvider.tsx    # TanStack Query
├── hooks/useCart.ts         # Zustand cart + wishlist (persisted)
└── middleware.ts            # Route protection + security headers

prisma/
├── schema.prisma            # 18-table schema
└── seed.ts                  # Admin, categories, commissions, settings

scripts/setup.sh             # First-time automated setup
docker-compose.yml           # Postgres + Redis + App
Dockerfile                   # Multi-stage production build
.env.example                 # All required env vars
```

---

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ecove_db
JWT_SECRET=your-32-char-secret
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
SMTP_HOST=smtp.hostinger.com
SMTP_USER=noreply@ecove.com.ng
SMTP_PASS=xxx
```
See `.env.example` for the full list.

---

## API Endpoints

### Public Storefront
- `GET /api/storefront/products` — products with full filtering/sorting/pagination
- `GET /api/storefront/products/[id]` — single product
- `GET /api/storefront/categories` — all active categories
- `GET /api/storefront/vendors/[slug]` — vendor store page
- `GET /api/storefront/search` — full-text search

### Auth
- `POST /api/auth/register` — customer signup
- `POST /api/auth/login` — login (JWT cookie)
- `POST /api/auth/vendor-register` — vendor application
- `POST /api/auth/verify-email` — email verification
- `POST /api/auth/forgot-password` / `reset-password`

### Vendor (requires vendor auth)
- `GET|POST /api/vendor/products` — list / create products (status = pending)
- `GET|PUT|DELETE /api/vendor/products/[id]`
- `GET /api/vendor/orders` — vendor's order items
- `PATCH /api/vendor/orders/[id]` — mark shipped/delivered
- `GET|POST /api/vendor/payouts` — history / request withdrawal
- `GET|PUT /api/vendor/profile`
- `GET /api/vendor/dashboard` — stats

### Admin (requires admin auth)
- `GET /api/admin/vendors` — list vendors
- `PATCH /api/admin/vendors/[id]` — approve/reject/suspend
- `GET /api/admin/products` — all products
- `PATCH /api/admin/products/[id]` — approve/reject
- `GET /api/admin/payouts` — payout requests
- `PATCH /api/admin/payouts/[id]` — approve/mark-paid
- `GET /api/admin/analytics` — real-time stats
- `GET|PUT /api/admin/settings` — site settings

### Payments
- `POST /api/checkout` — create order + init Paystack
- `GET /api/payments/paystack` — verify payment
- `POST /api/webhooks/paystack` — Paystack webhook (HMAC verified)
- `POST /api/upload` — upload to Cloudinary

---

## Database Commands

```bash
npm run db:generate    # Regenerate Prisma client
npm run db:migrate     # Apply migrations (production)
npm run db:migrate:dev # Create + apply migration (dev)
npm run db:seed        # Seed admin, categories, commissions
npm run db:studio      # Prisma Studio GUI
npm run db:reset       # ⚠ DESTROYS data, re-seeds
```

---

## Default Credentials

After seeding:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@ecove.com.ng` | `EcoveAdmin2025!` |

**⚠️ Change the admin password immediately after first login.**

- Storefront: `http://localhost:3000`
- Admin Panel: `http://localhost:3000/admin`
- Vendor Apply: `http://localhost:3000/vendor/register`
- Vendor Login: `http://localhost:3000/vendor/login`

---

## Deployment

### VPS (Ubuntu / HestiaCP)
```bash
# Install Node.js 20 + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pm2

# Deploy
bash scripts/setup.sh
npm run build
pm2 start npm --name "ecove" -- start
pm2 save && pm2 startup
```

### Docker
```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

### Vercel + Supabase
1. Push to GitHub → import to vercel.com
2. Add all env vars in Vercel dashboard
3. Set `DATABASE_URL` to Supabase connection string
4. Deploy automatically on push

---

*Ecove Marketplace · ecove.com.ng · Built for Nigeria 🇳🇬*
