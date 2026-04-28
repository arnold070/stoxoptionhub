import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginated, handleError, getPagination } from '@/lib/api'

// GET /api/admin/orders
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status   = sp.get('status') as any
    const vendorId = sp.get('vendorId')
    const search   = sp.get('q') || ''

    const where: any = {}
    if (status)   where.status = status
    if (vendorId) where.items  = { some: { vendorId } }
    if (search)   where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user:  { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            include: {
              vendor:  { select: { id: true, businessName: true } },
              product: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return paginated(orders, page, limit, total)
  } catch (err) { return handleError(err) }
}
