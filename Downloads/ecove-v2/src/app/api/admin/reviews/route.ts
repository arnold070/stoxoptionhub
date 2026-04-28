import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, paginated, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') as any || 'pending'

    const where: any = {}
    if (status !== 'all') where.status = status

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.review.count({ where }),
    ])

    return paginated(reviews, page, limit, total)
  } catch (err) { return handleError(err) }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({
      id: z.string(),
      action: z.enum(['approve', 'reject', 'flag']),
      flagReason: z.string().optional(),
    }).parse(await req.json())

    const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' }
    const review = await prisma.review.update({
      where: { id: body.id },
      data: {
        status: statusMap[body.action] as any,
        flagReason: body.flagReason,
        moderatedAt: new Date(),
        moderatedById: auth.sub,
      },
    })

    // Update product/vendor avg rating when approved
    if (body.action === 'approve' && review.productId) {
      const agg = await prisma.review.aggregate({
        where: { productId: review.productId, status: 'approved' },
        _avg: { rating: true },
        _count: true,
      })
      // Update vendor avg rating
      if (review.vendorId) {
        const vendorAgg = await prisma.review.aggregate({
          where: { vendorId: review.vendorId, status: 'approved' },
          _avg: { rating: true },
          _count: true,
        })
        await prisma.vendor.update({
          where: { id: review.vendorId },
          data: {
            averageRating: vendorAgg._avg.rating ?? 0,
            reviewCount: vendorAgg._count,
          },
        })
      }
    }

    return ok(review)
  } catch (err) { return handleError(err) }
}
