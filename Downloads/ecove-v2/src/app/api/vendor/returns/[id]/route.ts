import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['vendor'])
    const { action } = z.object({
      action: z.enum(['approve', 'reject']),
    }).parse(await req.json())

    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub } })
    if (!vendor) return apiError('Vendor not found', 404)

    // Verify this order item belongs to this vendor
    const item = await prisma.orderItem.findFirst({
      where: { id: params.id, vendorId: vendor.id },
    })
    if (!item) return apiError('Return request not found', 404)

    // Update fulfillment status based on action
    const newStatus = action === 'approve' ? 'refunded' : 'delivered'
    const updated = await prisma.orderItem.update({
      where: { id: params.id },
      data:  { fulfillmentStatus: newStatus as any },
    })

    return ok(updated)
  } catch (err) { return handleError(err) }
}
