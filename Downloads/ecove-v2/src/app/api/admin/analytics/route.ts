import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])

    const now       = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalVendors, activeVendors, pendingVendors,
      totalProducts, pendingProducts,
      totalOrders, monthOrders,
      revenueResult, monthRevenueResult, lastMonthRevenueResult,
      pendingPayouts, pendingPayoutCount, recentOrders, dailyRevenue, topVendors,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'approved' } }),
      prisma.vendor.count({ where: { status: 'pending' } }),
      prisma.product.count({ where: { status: 'approved' } }),
      prisma.product.count({ where: { status: 'pending' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid', createdAt: { gte: monthStart } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.payout.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
      prisma.payout.count({ where: { status: 'pending' } }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } }, items: { take: 1, include: { vendor: { select: { businessName: true } } } } } }),
      prisma.order.findMany({
        where: { paymentStatus: 'paid', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vendor.findMany({
        where: { status: 'approved' },
        orderBy: { totalSales: 'desc' },
        take: 5,
        select: { id: true, businessName: true, totalSales: true, totalOrders: true, averageRating: true },
      }),
    ])

    const totalRevenue     = revenueResult._sum.total?.toNumber()      || 0
    const monthRevenue     = monthRevenueResult._sum.total?.toNumber() || 0
    const lastMonthRevenue = lastMonthRevenueResult._sum.total?.toNumber() || 0
    const revenueGrowth    = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : null

    return ok({
      vendors:  { total: totalVendors, active: activeVendors, pending: pendingVendors },
      products: { live: totalProducts, pending: pendingProducts },
      orders:   { total: totalOrders, thisMonth: monthOrders },
      revenue:  { total: totalRevenue, thisMonth: monthRevenue, lastMonth: lastMonthRevenue, growth: revenueGrowth },
      commissions: { pending: pendingPayouts._sum.amount?.toNumber() || 0 },
      payoutRequests: pendingPayoutCount,
      dailyRevenue: (() => {
        const map = new Map<string, number>()
        for (const o of dailyRevenue) {
          const day = o.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          map.set(day, (map.get(day) || 0) + o.total.toNumber())
        }
        return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }))
      })(),
      recentOrders,
      topVendors,
    })
  } catch (err) { return handleError(err) }
}
