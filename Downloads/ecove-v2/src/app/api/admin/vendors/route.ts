import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginated, handleError, getPagination } from '@/lib/api'

// GET /api/admin/vendors
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp     = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') as any
    const search = sp.get('q') || ''

    const where: any = {}
    if (status) where.status = status
    if (search) where.OR = [
      { businessName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          _count: { select: { products: true, orderItems: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ])

    return paginated(vendors, page, limit, total)
  } catch (err) {
    return handleError(err)
  }
}
