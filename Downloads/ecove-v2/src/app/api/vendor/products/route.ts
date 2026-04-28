import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { created, apiError, paginated, handleError, getPagination } from '@/lib/api'
import { uniqueSlug } from '@/lib/utils'

const createSchema = z.object({
  name:            z.string().min(2).max(255),
  description:     z.string().optional(),
  shortDescription:z.string().max(160).optional(),
  price:           z.number().positive(),
  comparePrice:    z.number().positive().optional(),
  costPrice:       z.number().positive().optional(),
  sku:             z.string().max(100).optional(),
  stock:           z.number().int().min(0),
  lowStockAlert:   z.number().int().min(0).optional(),
  weight:          z.number().positive().optional(),
  categoryId:      z.string().optional(),
  brand:           z.string().max(100).optional(),
  handlingTime:    z.string().max(50).optional(),
  shipsFrom:       z.string().max(100).optional(),
  tags:            z.array(z.string()).optional(),
  specifications:  z.record(z.string()).optional(),
  variants: z.array(z.object({
    name:  z.string(),
    value: z.string(),
    stock: z.number().int().min(0),
    sku:   z.string().optional(),
    priceAdjustment: z.number().optional(),
  })).optional(),
})

// GET /api/vendor/products
export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') as any
    const search = sp.get('q') || ''

    const where: any = { vendorId: vendor.id }
    if (status) where.status = status
    if (search) where.name   = { contains: search, mode: 'insensitive' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images:   { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true } },
          _count:   { select: { orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return paginated(products, page, limit, total)
  } catch (err) { return handleError(err) }
}

// POST /api/vendor/products  — create new product (status = pending)
export async function POST(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub } })
    if (!vendor) return apiError('Vendor not found', 404)
    if (vendor.status !== 'approved') return apiError('Your vendor account is not active.', 403)

    // Check product limit
    const count = await prisma.product.count({ where: { vendorId: vendor.id } })
    if (count >= vendor.maxProducts) {
      return apiError(`You have reached your product limit of ${vendor.maxProducts}.`, 403)
    }

    const body = createSchema.parse(await req.json())
    const slug = await uniqueSlug(body.name, 'product')

    const { variants, ...productData } = body
    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        vendorId: vendor.id,
        status:   vendor.isAutoApproved ? 'approved' : 'pending',
        isActive: vendor.isAutoApproved,
        price:    productData.price as any,
        ...(variants?.length && {
          variants: { create: variants },
        }),
      },
      include: { variants: true },
    })

    return created(product)
  } catch (err) { return handleError(err) }
}
