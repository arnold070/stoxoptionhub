import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Ecove Marketplace database...')

  // ── 1. Super Admin account ───────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@ecove.com.ng'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'EcoveAdmin2025!'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        firstName:       'Ecove',
        lastName:        'Admin',
        email:           adminEmail,
        passwordHash:    await bcrypt.hash(adminPassword, 12),
        role:            'super_admin',
        isActive:        true,
        isEmailVerified: true,
      },
    })
    console.log(`✅ Admin created: ${adminEmail}`)
  } else {
    console.log(`⏭  Admin already exists: ${adminEmail}`)
  }

  // ── 2. Categories ────────────────────────────────────────
  const categories = [
    { name: 'Phones & Tablets',  slug: 'phones-tablets',   icon: '📱', order: 1 },
    { name: 'Computing',         slug: 'computing',         icon: '💻', order: 2 },
    { name: 'Electronics',       slug: 'electronics',       icon: '📺', order: 3 },
    { name: 'Fashion',           slug: 'fashion',           icon: '👗', order: 4 },
    { name: 'Home & Kitchen',    slug: 'home-kitchen',      icon: '🏠', order: 5 },
    { name: 'Beauty & Health',   slug: 'beauty-health',     icon: '💄', order: 6 },
    { name: 'Baby Products',     slug: 'baby-products',     icon: '👶', order: 7 },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors',   icon: '⚽', order: 8 },
    { name: 'Groceries',         slug: 'groceries',         icon: '🛒', order: 9 },
    { name: 'Automotive',        slug: 'automotive',        icon: '🚗', order: 10 },
    { name: 'Gaming',            slug: 'gaming',            icon: '🎮', order: 11 },
    { name: 'Books & Education', slug: 'books-education',   icon: '📚', order: 12 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: {
        name:         cat.name,
        slug:         cat.slug,
        displayOrder: cat.order,
        isActive:     true,
        metaTitle:    `${cat.name} – Shop Online | Ecove Marketplace`,
        metaDescription: `Buy ${cat.name.toLowerCase()} online in Nigeria at the best prices. Fast delivery nationwide. Shop on Ecove.`,
      },
    })
  }
  console.log(`✅ ${categories.length} categories seeded`)

  // ── 3. Commission rules ──────────────────────────────────
  // Global default
  await prisma.commissionRule.upsert({
    where:  { id: 'global-default' },
    update: {},
    create: { id: 'global-default', type: 'global', rate: 10, isActive: true, note: 'Default global commission rate' },
  })

  // Category-specific overrides
  const catCommissions: Record<string, number> = {
    'phones-tablets':  8,
    'computing':       8,
    'electronics':     8,
    'fashion':        15,
    'beauty-health':  18,
    'groceries':       5,
    'gaming':         10,
    'baby-products':  10,
  }

  for (const [slug, rate] of Object.entries(catCommissions)) {
    const cat = await prisma.category.findUnique({ where: { slug } })
    if (cat) {
      const existing = await prisma.commissionRule.findFirst({ where: { type: 'category', categoryId: cat.id } })
      if (!existing) {
        await prisma.commissionRule.create({
          data: { type: 'category', rate, categoryId: cat.id, isActive: true },
        })
      }
    }
  }
  console.log('✅ Commission rules seeded')

  // ── 4. Site settings ─────────────────────────────────────
  const settings: Record<string, string> = {
    'site.name':            'Ecove Marketplace',
    'site.tagline':         'Shop Smart, Live Better',
    'site.email':           'hello@ecove.com.ng',
    'site.phone':           '+234 800 ECOVE (32683)',
    'site.currency':        'NGN',
    'site.currency_symbol': '₦',
    'vendor.registration.open': 'true',
    'vendor.auto_approve':       'false',
    'product.auto_approve':      'false',
    'payout.min_amount':    '5000',
    'payout.clearing_days': '7',
    'payout.schedule':      'weekly',
    'seo.meta_title':       'Ecove – Nigeria\'s Online Marketplace | Shop Smart, Live Better',
    'seo.meta_description': 'Shop electronics, fashion, home appliances, phones, beauty products and more at the best prices in Nigeria. Fast delivery nationwide.',
    'social.whatsapp':      '+2348001234567',
    'social.instagram':     'ecoveng',
    'social.facebook':      'ecoveng',
    'social.twitter':       'ecoveng',
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where:  { key },
      update: {},
      create: { key, value },
    })
  }
  console.log(`✅ ${Object.keys(settings).length} site settings seeded`)

  console.log('\n🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Admin email:    ${adminEmail}`)
  // Admin password intentionally not logged — check .env.local or SEED_ADMIN_PASSWORD
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Change the admin password after first login!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
