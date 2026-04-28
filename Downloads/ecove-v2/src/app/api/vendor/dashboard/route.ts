import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({
      where: { userId: auth.sub },
      select: {
        id: true, businessName: true, slug: true, status: true,
        availableBalance: true, pendingBalance: true, lifetimePaid: true,
        totalSales: true, totalOrders: true, averageRating: true,
        reviewCount: true, responseRate: true, onTimeRate: true,
        bankName: true, bankAccountNumber: true, bankAccountName: true,
        logoUrl: true, bannerUrl: true, description: true, tagline: true,
        commissionRate: true, maxProducts: true, isAutoApproved: true,
      },
    })
    if (!vendor) return apiError('Vendor not found', 404)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [productCounts, monthOrders, monthRevenue, pendingPayout] = await Promise.all([
      prisma.product.groupBy({
        by: ['status'],
        where: { vendorId: vendor.id },
        _count: true,
      }),
      prisma.orderItem.count({
        where: { vendorId: vendor.id, createdAt: { gte: monthStart } },
      }),
      prisma.orderItem.aggregate({
        where: { vendorId: vendor.id, createdAt: { gte: monthStart } },
        _sum: { vendorEarning: true },
      }),
      prisma.payout.findFirst({
        where: { vendorId: vendor.id, status: 'pending' },
        select: { id: true, amount: true, requestedAt: true },
      }),
    ])

    const counts: Record<string, number> = {}
    productCounts.forEach((g) => { counts[g.status] = g._count })

    return ok({
      ...vendor,
      products: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        approved: counts.approved || 0,
        pending: counts.pending || 0,
        rejected: counts.rejected || 0,
        draft: counts.draft || 0,
      },
      thisMonth: {
        orders: monthOrders,
        revenue: monthRevenue._sum.vendorEarning?.toNumber() || 0,
      },
      pendingPayout,
    })
  } catch (err) { return handleError(err) }
}
