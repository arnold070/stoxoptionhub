import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Accept either uuid or slug
    const isUUID = /^[0-9a-f-]{36}$/.test(params.id)
    const where  = isUUID ? { id: params.id } : { slug: params.id }

    const product = await prisma.product.findFirst({
      where: { ...where, status: 'approved', isActive: true },
      include: {
        images:   { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
        vendor: {
          select: {
            id: true, businessName: true, slug: true, description: true,
            logoUrl: true, bannerUrl: true, averageRating: true,
            reviewCount: true, responseRate: true, onTimeRate: true,
            city: true, state: true, whatsapp: true,
            _count: { select: { products: true, orderItems: true } },
          },
        },
        reviews: {
          where:   { status: 'approved' },
          take:    10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        _count: { select: { reviews: true, orderItems: true } },
      },
    })

    if (!product) return apiError('Product not found', 404)

    // Fetch related products from same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        status:     'approved',
        isActive:   true,
        id:         { not: product.id },
      },
      take:   8,
      select: {
        id: true, name: true, slug: true, price: true, comparePrice: true,
        images:  { where: { isPrimary: true }, take: 1, select: { url: true } },
        vendor:  { select: { businessName: true } },
        _count:  { select: { reviews: true } },
      },
    })

    return ok({ product, related })
  } catch (err) { return handleError(err) }
}
