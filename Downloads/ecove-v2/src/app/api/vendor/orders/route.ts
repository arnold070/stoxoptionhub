import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, paginated, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') as any

    const where: any = { vendorId: vendor.id }
    if (status) where.fulfillmentStatus = status

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true, status: true, createdAt: true,
              shippingAddress: true,
              user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            },
          },
          product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } } },
        },
      }),
      prisma.orderItem.count({ where }),
    ])

    return paginated(items, page, limit, total)
  } catch (err) { return handleError(err) }
}

// PATCH — vendor updates fulfillment status / tracking number
export async function PATCH(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const body = z.object({
      itemId:           z.string(),
      fulfillmentStatus:z.enum(['processing','shipped','out_for_delivery','delivered']),
      trackingNumber:   z.string().max(100).optional(),
    }).parse(await req.json())

    const item = await prisma.orderItem.findFirst({ where: { id: body.itemId, vendorId: vendor.id } })
    if (!item) return apiError('Order item not found', 404)

    const updated = await prisma.orderItem.update({
      where: { id: body.itemId },
      data: {
        fulfillmentStatus: body.fulfillmentStatus as any,
        trackingNumber:    body.trackingNumber,
        ...(body.fulfillmentStatus === 'shipped'   && { shippedAt:    new Date() }),
        ...(body.fulfillmentStatus === 'delivered' && { deliveredAt:  new Date() }),
      },
    })

    return ok(updated)
  } catch (err) { return handleError(err) }
}
