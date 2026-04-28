import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginated, handleError, getPagination } from '@/lib/api'

// GET /api/admin/products  — list all products with filters
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status     = sp.get('status') as any
    const vendorId   = sp.get('vendorId')
    const categoryId = sp.get('categoryId')
    const search     = sp.get('q') || ''

    const where: any = {}
    if (status)     where.status = status
    if (vendorId)   where.vendorId = vendorId
    if (categoryId) where.categoryId = categoryId
    if (search)     where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ]

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor:   { select: { id: true, businessName: true, slug: true } },
          category: { select: { id: true, name: true } },
          images:   { where: { isPrimary: true }, take: 1 },
          _count:   { select: { orderItems: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return paginated(products, page, limit, total)
  } catch (err) { return handleError(err) }
}
