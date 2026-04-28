import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'
import { sendVendorNewOrder } from '@/lib/email'

export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const auth = await getAuthUser(req)
    const guestEmail = req.nextUrl.searchParams.get('email')

    // Allow guest tracking by orderNumber + email, or auth users by userId
    const where: any = { orderNumber: params.orderNumber }
    if (auth) {
      where.userId = auth.sub
    } else if (guestEmail) {
      where.guestEmail = guestEmail.toLowerCase().trim()
    } else {
      return apiError('Unauthorized', 401)
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
            },
            vendor: { select: { id: true, businessName: true, slug: true } },
          },
        },
      },
    })

    if (!order) return apiError('Order not found', 404)
    return ok(order)
  } catch (err) { return handleError(err) }
}

// PATCH /api/storefront/orders/[orderNumber] — customer cancels order
export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return apiError('Unauthorized', 401)

    const order = await prisma.order.findFirst({
      where: { orderNumber: params.orderNumber, userId: auth.sub },
      include: { items: true },
    })
    if (!order) return apiError('Order not found', 404)

    // Can only cancel if pending or processing (not shipped)
    if (!['pending', 'processing'].includes(order.status)) {
      return apiError(`Cannot cancel an order with status: ${order.status}. Contact support if shipped.`, 400)
    }
    if (order.paymentStatus === 'paid') {
      return apiError('This order has been paid. Please contact support to arrange a refund.', 400)
    }

    // Cancel and restore stock (only if stock was already decremented — paid orders)
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelled', cancelReason: 'Cancelled by customer' },
      })
      // Restore coupon usage if applicable
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode },
          data: { usedCount: { decrement: 1 } },
        }).catch(() => {})
      }
    })

    // Notify vendors their order was cancelled (non-blocking)
    const itemsWithVendors = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { vendor: { include: { user: { select: { email: true } } } } },
    }).catch(() => [])

    const vendorEmails = new Map<string, { email: string; biz: string; items: string[] }>()
    for (const item of itemsWithVendors) {
      if (!item.vendor) continue
      const key = item.vendorId!
      if (!vendorEmails.has(key)) {
        vendorEmails.set(key, { email: item.vendor.user.email, biz: item.vendor.businessName, items: [] })
      }
      vendorEmails.get(key)!.items.push(`${item.productName} ×${item.quantity}`)
    }
    for (const [, v] of vendorEmails) {
      // Re-use new-order email template with cancellation subject prefix
      sendVendorNewOrder(
        v.email, v.biz,
        `CANCELLED: ${order.orderNumber}`,
        v.items.join(', ') + ' — This order has been cancelled by the customer.'
      ).catch(() => {})
    }

    return ok({ message: 'Order cancelled successfully.' })
  } catch (err) { return handleError(err) }
}
