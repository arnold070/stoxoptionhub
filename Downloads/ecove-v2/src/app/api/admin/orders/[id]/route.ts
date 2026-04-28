import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

const patchSchema = z.object({
  status:       z.enum(['pending','processing','shipped','out_for_delivery','delivered','cancelled','refunded']).optional(),
  cancelReason: z.string().max(500).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user:  { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } } },
            vendor:  { select: { id: true, businessName: true } },
          },
        },
      },
    })
    if (!order) return apiError('Order not found', 404)
    return ok(order)
  } catch (err) { return handleError(err) }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = patchSchema.parse(await req.json())
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: body,
    })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'order_update', entityType: 'order', entityId: params.id, meta: body },
    })
    return ok(updated)
  } catch (err) { return handleError(err) }
}
