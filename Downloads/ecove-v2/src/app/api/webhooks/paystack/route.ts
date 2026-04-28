import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendOrderConfirmation, sendVendorNewOrder } from '@/lib/email'
import { Decimal } from '@prisma/client/runtime/library'

// Maximum execution time (seconds) — important for Vercel Pro users
export const maxDuration = 60

// Paystack sends events to this endpoint after payment
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''

    // ── 1. Verify webhook signature ──────────────────────────
    const hash = crypto
      .createHmac('sha512', (await getPaystackConfig()).secretKey || '')
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // ── 2. Handle charge.success event ──────────────────────
    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data
      if (status !== 'success') return NextResponse.json({ received: true })

      // Idempotency: use Redis lock to prevent double-processing concurrent webhooks
      let releaseLock: (() => Promise<void>) | null = null
      if (process.env.REDIS_URL) {
        try {
          const { default: IORedis } = await import('ioredis')
          const redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true })
          await redis.connect()
          const lockKey = `webhook_lock:${reference}`
          const acquired = await redis.set(lockKey, '1', 'EX', 60, 'NX') // 60s lock
          if (!acquired) {
            await redis.disconnect()
            logger.info(`[Webhook] Duplicate event skipped for ref: ${reference}`)
            return NextResponse.json({ received: true })
          }
          releaseLock = async () => { await redis.del(lockKey); await redis.disconnect() }
        } catch { /* Redis unavailable - continue without lock */ }
      }

      // Find order by reference (orderNumber)
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: reference },
            { paymentRef:  reference },
          ],
        },
        include: { items: true },
      })

      if (!order) {
        logger.error(`[Webhook] Order not found for reference: ${reference}`)
        return NextResponse.json({ received: true })
      }

      // Idempotency: skip if already paid
      if (order.paymentStatus === 'paid') {
        return NextResponse.json({ received: true })
      }

      // Verify amount matches (Paystack sends kobo)
      const paidAmount = new Decimal(amount).div(100)
      const expected   = order.total

      if (paidAmount.lt(expected.minus(1))) { // allow ₦1 tolerance
        logger.error(`[Webhook] Amount mismatch: paid ${paidAmount}, expected ${expected}`)
        return NextResponse.json({ received: true })
      }

      // ── 3. Mark order as paid and update vendor balances ──
      await prisma.$transaction(async (tx) => {
        // Update order
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            status:        'processing',
            paymentMethod: event.data.channel || 'card',
          },
        })

        // Update order items to processing
        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data:  { fulfillmentStatus: 'processing' },
        })

        // Decrement stock now that payment is confirmed
        for (const item of order.items) {
          if (!item.productId) continue
          await tx.product.update({
            where: { id: item.productId },
            data:  { stock: { decrement: item.quantity } },
          }).catch(() => {}) // ignore if product deleted
        }

        // Increment coupon usage if applicable
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode },
            data:  { usedCount: { increment: 1 } },
          }).catch(() => {})
        }

        // Credit vendor earnings to pending balance
        const vendorEarnings = new Map<string, Decimal>()
        for (const item of order.items) {
          if (!item.vendorId) continue
          const curr = vendorEarnings.get(item.vendorId) || new Decimal(0)
          vendorEarnings.set(item.vendorId, curr.add(item.vendorEarning))
        }

        for (const [vendorId, earning] of vendorEarnings) {
          await tx.vendor.update({
            where: { id: vendorId },
            data: {
              pendingBalance: { increment: earning },
              totalSales:     { increment: earning },
              totalOrders:    { increment: 1 },
            },
          })
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            action:     'payment_confirmed',
            entityType: 'order',
            entityId:   order.id,
            meta:       { reference, amount: paidAmount.toFixed(2), channel: event.data.channel },
          },
        })
      })
      // ── 4. Send confirmation emails (non-blocking, after tx) ──
      const customerEmail = order.guestEmail || await (async () => {
        if (!order.userId) return null
        const u = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, firstName: true } })
        return u?.email || null
      })()
      const addr = order.shippingAddress as any

      if (customerEmail) {
        const firstName = addr?.firstName || 'Customer'
        sendOrderConfirmation(customerEmail, firstName, order.orderNumber, `₦${order.total.toFixed(2)}`).catch(() => {})
      }

      // Notify vendors — batch fetch to avoid N+1
      const vendorIds = [...new Set(order.items.map((i: { vendorId?: string | null }) => i.vendorId).filter(Boolean))] as string[]
      const vendorRows = await prisma.vendor.findMany({
        where:  { id: { in: vendorIds } },
        select: { id: true, businessName: true, user: { select: { email: true } } },
      }).catch(() => [])
      const vendorEmailMap = new Map(vendorRows.map((v: { id: string; businessName: string; user: { email: string } }) => [
        v.id, { email: v.user.email, biz: v.businessName },
      ]))
      const vendorMap = new Map<string, { email: string; biz: string; items: string[] }>()
      for (const item of order.items) {
        if (!item.vendorId) continue
        const vinfo = vendorEmailMap.get(item.vendorId)
        if (!vinfo) continue
        if (!vendorMap.has(item.vendorId)) {
          vendorMap.set(item.vendorId, { email: vinfo.email, biz: vinfo.biz, items: [] })
        }
        vendorMap.get(item.vendorId)!.items.push(`${item.productName} × ${item.quantity}`)
      }
      for (const [, v] of vendorMap) {
        sendVendorNewOrder(v.email, v.biz, order.orderNumber, v.items.join('<br/>')).catch(() => {})
      }
    }

    // ── 4. Handle refund event ───────────────────────────────
    if (event.event === 'refund.processed') {
      const { transaction_reference, amount } = event.data
      const order = await prisma.order.findFirst({
        where: { OR: [{ orderNumber: transaction_reference }, { paymentRef: transaction_reference }] },
      })
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data:  { paymentStatus: 'refunded', status: 'refunded' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('[Webhook Error]', err)
    // Always return 200 to Paystack so it stops retrying for non-signature errors
    return NextResponse.json({ received: true })
  }
}
