import { describe, it, expect } from 'vitest'

// ── Product filter query builder logic ────────────────────
interface ProductFilter {
  q?: string; category?: string; minPrice?: number; maxPrice?: number
  inStock?: boolean; flashSale?: boolean; sort?: string
}

function buildWhere(filter: ProductFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: 'approved',
    isActive: true,
    price: {
      gte: filter.minPrice ?? 0,
      lte: filter.maxPrice ?? 999999999,
    },
  }
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: 'insensitive' } },
      { description: { contains: filter.q, mode: 'insensitive' } },
      { brand: { contains: filter.q, mode: 'insensitive' } },
    ]
  }
  if (filter.category) where.category = { slug: filter.category }
  if (filter.inStock) where.stock = { gt: 0 }
  if (filter.flashSale) {
    where.isFlashSale = true
    where.flashSaleEnd = { gt: new Date() }
  }
  return where
}

describe('Product search filter builder', () => {
  it('always includes status and isActive', () => {
    const where = buildWhere({})
    expect(where.status).toBe('approved')
    expect(where.isActive).toBe(true)
  })

  it('adds OR clause for text search', () => {
    const where = buildWhere({ q: 'iPhone' }) as any
    expect(where.OR).toBeDefined()
    expect(where.OR).toHaveLength(3)
  })

  it('no OR clause without search term', () => {
    const where = buildWhere({})
    expect(where.OR).toBeUndefined()
  })

  it('adds category filter', () => {
    const where = buildWhere({ category: 'phones-tablets' }) as any
    expect(where.category.slug).toBe('phones-tablets')
  })

  it('adds in-stock filter', () => {
    const where = buildWhere({ inStock: true }) as any
    expect(where.stock.gt).toBe(0)
  })

  it('default price range covers all products', () => {
    const where = buildWhere({}) as any
    expect(where.price.gte).toBe(0)
    expect(where.price.lte).toBe(999999999)
  })

  it('applies custom price range', () => {
    const where = buildWhere({ minPrice: 5000, maxPrice: 50000 }) as any
    expect(where.price.gte).toBe(5000)
    expect(where.price.lte).toBe(50000)
  })
})

// ── Order number format validation ─────────────────────────
describe('Order number format', () => {
  const ORDER_PATTERN = /^ECO-\d{6}-\d{6}$/

  it('matches valid order numbers', () => {
    expect('ECO-250101-123456').toMatch(ORDER_PATTERN)
    expect('ECO-251231-999999').toMatch(ORDER_PATTERN)
  })

  it('rejects invalid formats', () => {
    expect('ECO-25-123').not.toMatch(ORDER_PATTERN)
    expect('ORD-250101-123456').not.toMatch(ORDER_PATTERN)
    expect('eco-250101-123456').not.toMatch(ORDER_PATTERN)
  })
})
