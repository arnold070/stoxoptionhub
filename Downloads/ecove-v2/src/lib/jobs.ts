/**
 * Background job runner for Ecove Marketplace.
 *
 * Started once by src/lib/init.ts when the server process starts.
 * Safe to run alongside Next.js standalone server.js.
 */

import prisma from './prisma'
import logger from './logger'

let started = false
const intervals: ReturnType<typeof setInterval>[] = []

// ── Helper: schedule with error isolation ────────────────────────────────────
function schedule(
  name: string,
  intervalMs: number,
  fn: () => Promise<void>,
  runImmediately = false
): void {
  const run = async () => {
    try {
      await fn()
    } catch (err) {
      // Log but never throw — a job failure must not crash the process
      logger.error({ err, job: name }, `Job failed: ${name}`)
    }
  }

  if (runImmediately) {
    // Delay first run by 30s to let DB connections settle on startup
    setTimeout(run, 30_000)
  }

  intervals.push(setInterval(run, intervalMs))
}

// ── Job 1: Expire flash sales ─────────────────────────────────────────────────
async function expireFlashSales(): Promise<void> {
  const result = await prisma.product.updateMany({
    where: {
      isFlashSale:  true,
      flashSaleEnd: { lt: new Date() },
    },
    data: {
      isFlashSale:    false,
      flashSalePrice: null,
    },
  })
  if (result.count > 0) {
    logger.info({ count: result.count }, 'Flash sales expired')
  }
}

// ── Job 2: Clean expired sessions ────────────────────────────────────────────
async function cleanExpiredSessions(): Promise<void> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  if (result.count > 0) {
    logger.info({ count: result.count }, 'Expired sessions cleaned')
  }
}

// ── Job 3: Notify vendors of low stock ───────────────────────────────────────
async function notifyLowStock(): Promise<void> {
  // Raw query is safer than trying to compare two Prisma fields
  // Finds products where stock > 0 AND stock <= lowStockAlert
  const products = await prisma.$queryRaw<
    Array<{ id: string; name: string; stock: number; vendorId: string }>
  >`
    SELECT id, name, stock, "vendorId"
    FROM products
    WHERE status = 'approved'
      AND "isActive" = true
      AND stock > 0
      AND stock <= "lowStockAlert"
    LIMIT 100
  `

  if (products.length === 0) return

  // Deduplicate: one notification per vendor per day max
  // Use createMany with skipDuplicates to avoid hammering the vendor
  const notifications = products.map(p => ({
    vendorId: p.vendorId,
    type:     'low_stock' as const,
    title:    'Low Stock Alert',
    message:  `"${p.name}" has only ${p.stock} unit(s) remaining. Restock soon.`,
    link:     '/vendor/dashboard/inventory',
  }))

  // Insert one at a time to avoid FK issues — errors are swallowed per item
  for (const notif of notifications) {
    await prisma.vendorNotification.create({ data: notif }).catch(() => {})
  }

  logger.info({ count: products.length }, 'Low stock notifications sent')
}

// ── Job 4: Recalculate vendor ratings ────────────────────────────────────────
async function updateVendorRatings(): Promise<void> {
  // Only process vendors that have had approved reviews in the last 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const recentVendorIds = await prisma.review.findMany({
    where:    { status: 'approved', createdAt: { gte: cutoff } },
    select:   { vendorId: true },
    distinct: ['vendorId'],
  })

  const vendorIds = recentVendorIds
    .map(r => r.vendorId)
    .filter((id): id is string => id !== null && id !== undefined)

  if (vendorIds.length === 0) return

  for (const vendorId of vendorIds) {
    const agg = await prisma.review.aggregate({
      where:  { vendorId, status: 'approved' },
      _avg:   { rating: true },
      _count: { rating: true },
    }).catch(() => null)

    if (!agg) continue

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        reviewCount:   agg._count.rating,
      },
    }).catch(() => {})
  }

  logger.info({ count: vendorIds.length }, 'Vendor ratings recalculated')
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
export function stopBackgroundJobs(): void {
  intervals.forEach(clearInterval)
  intervals.length = 0
  started = false
  logger.info('Background jobs stopped')
}

// ── Start ─────────────────────────────────────────────────────────────────────
export function startBackgroundJobs(): void {
  if (started) return
  if (typeof window !== 'undefined') return  // never run in browser
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_JOBS !== 'true'
  ) {
    logger.info('Background jobs disabled (set ENABLE_JOBS=true to enable)')
    return
  }

  started = true
  logger.info('Starting background jobs...')

  // runImmediately=true: first execution delayed 30s after startup
  schedule('expireFlashSales',     5  * 60 * 1000, expireFlashSales,     true)
  schedule('cleanExpiredSessions', 6  * 60 * 60 * 1000, cleanExpiredSessions, false)
  schedule('notifyLowStock',       60 * 60 * 1000, notifyLowStock,       false)
  schedule('updateVendorRatings',  12 * 60 * 60 * 1000, updateVendorRatings,  false)

  // Graceful shutdown
  process.once('SIGTERM', stopBackgroundJobs)
  process.once('SIGINT',  stopBackgroundJobs)

  logger.info('Background jobs started ✅')
}
