import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError, getPagination } from '@/lib/api'

// GET /api/vendor/returns — order items with refund/cancellation requests
export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const sp     = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const status = sp.get('status') || ''

    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub } })
    if (!vendor) return ok({ data: [], pagination: null })

    // Map frontend status to fulfillmentStatus values
    const statusMap: Record<string, string[]> = {
      requested:  ['cancelled'],
      approved:   ['refunded'],
      completed:  ['refunded'],
    }
    const fulfillmentStatuses = status && statusMap[status]
      ? statusMap[status]
      : ['cancelled', 'refunded']

    const where = {
      vendorId:          vendor.id,
      fulfillmentStatus: { in: fulfillmentStatuses as any },
    }

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true, createdAt: true } } },
      }),
      prisma.orderItem.count({ where }),
    ])

    const data = items.map(item => ({
      id:           item.id,
      orderNumber:  item.order.orderNumber,
      productName:  item.productName,
      productImage: item.productImage,
      quantity:     item.quantity,
      totalPrice:   item.totalPrice,
      variant:      item.variant,
      status:       item.fulfillmentStatus === 'cancelled' ? 'requested' : 'completed',
      returnReason: item.fulfillmentStatus === 'cancelled' ? 'Cancelled by customer' : 'Refunded',
      createdAt:    item.order.createdAt,
    }))

    return ok({
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (err) { return handleError(err) }
}
