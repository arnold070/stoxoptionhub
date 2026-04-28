import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginated, handleError, getPagination } from '@/lib/api'

// GET /api/admin/payouts
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') as any

    const where: any = {}
    if (status) where.status = status

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where, skip, take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, businessName: true, availableBalance: true,
              user: { select: { email: true } } }
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.payout.count({ where }),
    ])

    return paginated(payouts, page, limit, total)
  } catch (err) { return handleError(err) }
}
