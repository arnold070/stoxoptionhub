import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const sp       = req.nextUrl.searchParams
    const q        = (sp.get('q') || '').trim()
    const category = sp.get('category') || ''
    const minPrice = parseFloat(sp.get('minPrice') || '0')  || 0
    const maxPrice = parseFloat(sp.get('maxPrice') || '0')  || 999999999
    const sort     = sp.get('sort') || 'relevance'
    const inStock  = sp.get('inStock') === 'true'
    const flashSale = sp.get('flashSale') === 'true'
    const featured  = sp.get('featured') === 'true'
    const bestSeller = sp.get('bestSeller') === 'true'
    const vendorSlug = sp.get('vendor') || ''
    const typeahead = sp.get('typeahead') === 'true'
    const { page, limit, skip } = getPagination(sp)

    // ── Typeahead (lightweight — returns names only) ─────────
    if (typeahead && q.length >= 2) {
      const [products, categories] = await Promise.all([
        prisma.product.findMany({
          where: {
            status: 'approved', isActive: true,
            name: { contains: q, mode: 'insensitive' },
          },
          select: {
            id: true, name: true, slug: true, price: true,
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
          take: 5,
        }),
        prisma.category.findMany({
          where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
          select: { id: true, name: true, slug: true },
          take: 3,
        }),
      ])
      return ok({ products, categories })
    }

    // ── Build WHERE clause ────────────────────────────────────
    const where: Record<string, unknown> = {
      status: 'approved',
      isActive: true,
      price: { gte: minPrice, lte: maxPrice },
    }

    if (q) {
      // Use full-text search when query present; fall back to ILIKE for short terms
      if (q.length >= 3) {
        // PostgreSQL full-text search across name + description
        where.OR = [
          { name:        { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { brand:       { contains: q, mode: 'insensitive' } },
          { tags:        { has: q.toLowerCase() } },
        ]
      } else {
        where.OR = [
          { name:  { startsWith: q, mode: 'insensitive' } },
          { brand: { startsWith: q, mode: 'insensitive' } },
        ]
      }
    }

    if (category)   where.category   = { slug: category }
    if (inStock)    where.stock       = { gt: 0 }
    if (flashSale)  { where.isFlashSale = true; where.flashSaleEnd = { gt: new Date() } }
    if (featured)   where.isFeatured  = true
    if (bestSeller) where.isBestSeller = true
    if (vendorSlug) where.vendor      = { slug: vendorSlug }

    // ── Sort ─────────────────────────────────────────────────
    const orderBy: Record<string, string>[] =
      sort === 'price_asc'   ? [{ price: 'asc' }]  :
      sort === 'price_desc'  ? [{ price: 'desc' }] :
      sort === 'newest'      ? [{ createdAt: 'desc' }] :
      sort === 'bestseller'  ? [{ isBestSeller: 'desc' }, { createdAt: 'desc' }] :
      sort === 'rating'      ? [{ vendor: { averageRating: 'desc' } }] :
      // Default: relevance (featured first, then bestsellers, then newest)
      [{ isFeatured: 'desc' }, { isBestSeller: 'desc' }, { createdAt: 'desc' }]

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: where as Parameters<typeof prisma.product.findMany>[0]['where'],
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          stock: true, isFlashSale: true, flashSalePrice: true, flashSaleEnd: true,
          isFeatured: true, isBestSeller: true, brand: true,
          images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          vendor:   { select: { id: true, businessName: true, slug: true, averageRating: true } },
          _count:   { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where: where as Parameters<typeof prisma.product.count>[0]['where'] }),
    ])

    const totalPages = Math.ceil(total / limit)

    return ok({
      products,
      pagination: {
        page, limit, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (err) { return handleError(err) }
}
