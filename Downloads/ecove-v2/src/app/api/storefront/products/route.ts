import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { paginated, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)

    const search     = sp.get('q') || ''
    const categorySlug = sp.get('category') || ''
    const vendorId   = sp.get('vendor') || ''
    const brand      = sp.get('brand') || ''
    const minPrice   = parseFloat(sp.get('minPrice') || '0')
    const maxPrice   = parseFloat(sp.get('maxPrice') || '999999999')
    const inStock    = sp.get('inStock') === 'true'
    const featured   = sp.get('featured') === 'true'
    const bestSeller = sp.get('bestSeller') === 'true'
    const flashSale  = sp.get('flashSale') === 'true'
    const sort       = sp.get('sort') || 'newest'
    const tags       = sp.get('tags')?.split(',').filter(Boolean) || []

    const where: any = {
      status:   'approved',
      isActive: true,
      price:    { gte: minPrice, lte: maxPrice },
    }

    if (search)     where.OR = [
      { name:        { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { brand:       { contains: search, mode: 'insensitive' } },
      { tags:        { has: search } },
    ]
    if (categorySlug) where.category = { slug: categorySlug }
    if (vendorId)     where.vendorId  = vendorId
    if (brand)        where.brand     = { contains: brand, mode: 'insensitive' }
    if (inStock)      where.stock     = { gt: 0 }
    if (featured)     where.isFeatured   = true
    if (bestSeller)   where.isBestSeller = true
    if (flashSale) {
      where.isFlashSale  = true
      where.flashSaleEnd = { gt: new Date() }
    }
    if (tags.length)  where.tags = { hasSome: tags }

    const orderBy: any =
      sort === 'price_asc'  ? { price: 'asc' }  :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'popular'    ? { orderItems: { _count: 'desc' } } :
      sort === 'rating'     ? { reviews:    { _count: 'desc' } } :
      { createdAt: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy,
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          stock: true, isFeatured: true, isBestSeller: true,
          isFlashSale: true, flashSalePrice: true, flashSaleEnd: true,
          brand: true, tags: true,
          images:   { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
          category: { select: { id: true, name: true, slug: true } },
          vendor:   { select: { id: true, businessName: true, slug: true, averageRating: true } },
          _count:   { select: { reviews: true, orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return paginated(products, page, limit, total)
  } catch (err) { return handleError(err) }
}
