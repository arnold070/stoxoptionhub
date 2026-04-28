import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const sp     = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const ratingFilter = sp.get('rating')

    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub } })
    if (!vendor) return ok({ data: [], pagination: null, summary: null })

    let ratingWhere: any = {}
    if (ratingFilter === 'low')  ratingWhere = { rating: { lte: 2 } }
    else if (ratingFilter)       ratingWhere = { rating: parseInt(ratingFilter) }

    const where = { vendorId: vendor.id, status: 'approved', ...ratingWhere }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user:    { select: { firstName: true, lastName: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ])

    const all = await prisma.review.findMany({
      where:  { vendorId: vendor.id, status: 'approved' },
      select: { rating: true },
    })
    const avg = all.length > 0 ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0

    return ok({
      data: reviews,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      summary: {
        total:         all.length,
        averageRating: avg.toFixed(1),
        fiveAndFour:   all.filter(r => r.rating >= 4).length,
        oneAndTwo:     all.filter(r => r.rating <= 2).length,
      },
    })
  } catch (err) { return handleError(err) }
}
