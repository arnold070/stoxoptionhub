import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

const editSchema = z.object({
  name:            z.string().min(2).max(255).optional(),
  description:     z.string().optional(),
  shortDescription:z.string().max(160).optional(),
  price:           z.number().positive().optional(),
  comparePrice:    z.number().positive().optional(),
  stock:           z.number().int().min(0).optional(),
  lowStockAlert:   z.number().int().min(0).optional(),
  categoryId:      z.string().optional(),
  brand:           z.string().max(100).optional(),
  handlingTime:    z.string().max(50).optional(),
  shipsFrom:       z.string().max(100).optional(),
  tags:            z.array(z.string()).optional(),
  specifications:  z.record(z.string()).optional(),
  resubmit:        z.boolean().optional(),
  images:          z.array(z.object({ url: z.string().url(), isPrimary: z.boolean() })).optional(),
})

async function ownsProduct(userId: string, productId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } })
  if (!vendor) return null
  const product = await prisma.product.findFirst({ where: { id: productId, vendorId: vendor.id } })
  return product
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth    = await requireAuth(req, ['vendor'])
    const product = await ownsProduct(auth.sub, params.id)
    if (!product) return apiError('Product not found', 404)
    const full = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true, variants: true, category: { select: { id: true, name: true } } },
    })
    return ok(full)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth    = await requireAuth(req, ['vendor'])
    const product = await ownsProduct(auth.sub, params.id)
    if (!product) return apiError('Product not found', 404)

    // Approved products: only allow stock/price edits without re-review
    if (product.status === 'approved') {
      const safeFields = z.object({
        stock: z.number().int().min(0).optional(),
        lowStockAlert: z.number().int().min(0).optional(),
        price: z.number().positive().optional(),
      }).parse(await req.json())
      const updated = await prisma.product.update({ where: { id: params.id }, data: safeFields })
      return ok(updated)
    }

    const body = editSchema.parse(await req.json())
    const { resubmit, images, ...data } = body
    const updated = await prisma.product.update({
      where: { id: params.id },
      data:  {
        ...data,
        ...(resubmit && product.status === 'rejected' && { status: 'pending', adminNote: null }),
      },
    })
    if (images && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: params.id } })
      await prisma.productImage.createMany({
        data: images.map((img, i) => ({
          productId: params.id, url: img.url,
          isPrimary: img.isPrimary || i === 0, sortOrder: i,
        })),
      })
    }
    return ok(updated)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth    = await requireAuth(req, ['vendor'])
    const product = await ownsProduct(auth.sub, params.id)
    if (!product) return apiError('Product not found', 404)
    if (product.status === 'approved' && (product as any)._count?.orderItems > 0) {
      // Soft delete: deactivate rather than hard delete if it has orders
      await prisma.product.update({ where: { id: params.id }, data: { isActive: false, status: 'suspended' } })
      return ok({ message: 'Product deactivated.' })
    }
    await prisma.product.delete({ where: { id: params.id } })
    return ok({ message: 'Product deleted.' })
  } catch (err) { return handleError(err) }
}
