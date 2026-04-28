import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { paginated, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const search = sp.get('q') || ''

    const where: any = { status: 'approved' }
    if (search) where.businessName = { contains: search, mode: 'insensitive' }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where, skip, take: limit,
        orderBy: { totalSales: 'desc' },
        select: {
          id: true, businessName: true, slug: true, tagline: true,
          description: true, logoUrl: true, bannerUrl: true,
          city: true, state: true, averageRating: true, reviewCount: true,
          _count: { select: { products: { where: { status: 'approved', isActive: true } } } },
        },
      }),
      prisma.vendor.count({ where }),
    ])

    return paginated(vendors, page, limit, total)
  } catch (err) { return handleError(err) }
}
