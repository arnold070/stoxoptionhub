import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

const schema = z.object({
  fulfillmentStatus: z.enum(['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
  trackingNumber: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const item = await prisma.orderItem.findFirst({ where: { id: params.id, vendorId: vendor.id } })
    if (!item) return apiError('Order item not found', 404)

    const body = schema.parse(await req.json())
    const updated = await prisma.orderItem.update({
      where: { id: params.id },
      data: {
        fulfillmentStatus: body.fulfillmentStatus as any,
        trackingNumber: body.trackingNumber,
        ...(body.fulfillmentStatus === 'shipped' && { shippedAt: new Date() }),
        ...(body.fulfillmentStatus === 'delivered' && { deliveredAt: new Date() }),
      },
    })

    // Release earnings to available balance after delivery
    if (body.fulfillmentStatus === 'delivered') {
      // Move earnings to available balance (7-day hold policy enforced at payout request time)
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { pendingBalance: { decrement: item.vendorEarning }, availableBalance: { increment: item.vendorEarning } },
      })
    }

    return ok(updated)
  } catch (err) { return handleError(err) }
}
