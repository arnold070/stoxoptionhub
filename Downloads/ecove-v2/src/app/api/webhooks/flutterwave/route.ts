import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { getFlutterwaveConfig } from '@/lib/config'
import prisma from '@/lib/prisma'
import { sendOrderConfirmation, sendVendorNewOrder } from '@/lib/email'

// Maximum execution time (seconds) — important for Vercel Pro users
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('verif-hash') || ''
    const { webhookSecret: secretHash } = await getFlutterwaveConfig()

    // Secret is REQUIRED. If not configured via dashboard or env var, reject all requests.
    if (!secretHash) {
      logger.error('[FLW Webhook] Flutterwave webhook secret not set — rejecting request')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }
    if (signature !== secretHash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Handle successful charge
    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      const txRef = event.data.tx_ref
      const order = await prisma.order.findFirst({
        where: { paymentRef: txRef },
        include: { items: true },
      })

      if (!order || order.paymentStatus === 'paid') {
        return NextResponse.json({ received: true })
      }

      // Verify amount
      const paidAmount = Number(event.data.amount)
      const expectedAmount = Number(order.total)
      if (paidAmount < expectedAmount - 1) {
        logger.error(`[FLW Webhook] Amount mismatch: paid ${paidAmount}, expected ${expectedAmount}`)
        return NextResponse.json({ received: true })
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            status: 'processing',
            paymentMethod: event.data.payment_type || 'flutterwave',
          },
        })
        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { fulfillmentStatus: 'processing' },
        })

        // Decrement stock
        for (const item of order.items) {
          if (!item.productId) continue
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }).catch(() => {})
        }

        // Increment coupon usage
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode },
            data: { usedCount: { increment: 1 } },
          }).catch(() => {})
        }

        const vendorEarnings = new Map<string, number>()
        for (const item of order.items) {
          if (!item.vendorId) continue
          vendorEarnings.set(item.vendorId, (vendorEarnings.get(item.vendorId) || 0) + Number(item.vendorEarning))
        }
        for (const [vendorId, earning] of vendorEarnings) {
          await tx.vendor.update({
            where: { id: vendorId },
            data: {
              pendingBalance: { increment: earning },
              totalSales: { increment: earning },
              totalOrders: { increment: 1 },
            },
          })
        }

        await tx.auditLog.create({
          data: {
            action: 'flw_payment_confirmed',
            entityType: 'order',
            entityId: order.id,
            meta: { txRef, amount: paidAmount, paymentType: event.data.payment_type },
          },
        })
      })
      // Send confirmation emails
      const customerEmail = order.guestEmail || await (async () => {
        if (!order.userId) return null
        const u = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } })
        return u?.email || null
      })()
      const addr = order.shippingAddress as any
      if (customerEmail) {
        sendOrderConfirmation(customerEmail, addr?.firstName || 'Customer', order.orderNumber, `₦${order.total.toFixed(2)}`).catch(() => {})
      }
      const vids = [...new Set(order.items.map((i: any) => i.vendorId).filter(Boolean))] as string[]
      const vs = await prisma.vendor.findMany({ where: { id: { in: vids } }, select: { id: true, businessName: true, user: { select: { email: true } } } }).catch(() => [])
      const vm = new Map(vs.map((v: any) => [v.id, { email: v.user.email, biz: v.businessName, items: [] as string[] }]))
      for (const item of order.items) {
        if (item.vendorId && vm.has(item.vendorId)) vm.get(item.vendorId)!.items.push(`${item.productName} × ${item.quantity}`)
      }
      for (const [, v] of vm) sendVendorNewOrder(v.email, v.biz, order.orderNumber, v.items.join('<br/>')).catch(() => {})
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('[FLW Webhook Error]', err)
    return NextResponse.json({ received: true })
  }
}
