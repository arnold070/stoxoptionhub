import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError, getPagination } from '@/lib/api'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { slug: params.slug },
      select: {
        id: true, businessName: true, slug: true, tagline: true, description: true,
        logoUrl: true, bannerUrl: true, city: true, state: true, whatsapp: true,
        averageRating: true, reviewCount: true, responseRate: true, onTimeRate: true,
        totalOrders: true, createdAt: true,
        _count: { select: { products: { where: { status: 'approved', isActive: true } } } },
      },
    })

    if (!vendor) return apiError('Store not found', 404)

    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const sort     = sp.get('sort') || 'newest'
    const category = sp.get('category') || ''
    const minPrice = parseFloat(sp.get('minPrice') || '0')
    const maxPrice = parseFloat(sp.get('maxPrice') || '999999999')

    const where: any = {
      vendorId: vendor.id,
      status:   'approved',
      isActive: true,
      price:    { gte: minPrice, lte: maxPrice },
    }
    if (category) where.category = { slug: category }

    const orderBy: any =
      sort === 'price_asc'  ? { price: 'asc' }  :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'popular'    ? { orderItems: { _count: 'desc' } } :
      { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy,
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          stock: true, isFlashSale: true, flashSalePrice: true,
          images:   { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count:   { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Vendor reviews
    const reviews = await prisma.vendorReview.findMany({
      where:   { vendorId: vendor.id, status: 'approved' },
      take:    5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    })

    // Store categories (only those with products)
    const storeCategories = await prisma.category.findMany({
      where: { products: { some: { vendorId: vendor.id, status: 'approved', isActive: true } } },
      select: { id: true, name: true, slug: true },
    })

    return ok({
      vendor,
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reviews,
      storeCategories,
    })
  } catch (err) { return handleError(err) }
}
