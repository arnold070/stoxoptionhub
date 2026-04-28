import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'
import { getFlutterwaveConfig } from '@/lib/config'

const initSchema = z.object({ orderId: z.string(), email: z.string().email() })
const verifySchema = z.object({ transactionId: z.string() })

// POST /api/payments/flutterwave — initialize
export async function POST(req: NextRequest) {
  try {
    const body = initSchema.parse(await req.json())
    const order = await prisma.order.findUnique({ where: { id: body.orderId } })
    if (!order) return apiError('Order not found', 404)
    if (order.paymentStatus === 'paid') return apiError('Order already paid', 400)

    const { secretKey } = await getFlutterwaveConfig()
    if (!secretKey) return apiError('Flutterwave is not configured. Add keys in Admin → Settings.', 503)

    const txRef = `ECO-FLW-${order.orderNumber}-${Date.now()}`

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Number(order.total),
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirm?ref=${order.orderNumber}&gateway=flw`,
        customer: { email: body.email },
        meta: { order_id: order.id, order_number: order.orderNumber },
        customizations: {
          title: 'Ecove Marketplace',
          description: `Order #${order.orderNumber}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        },
        payment_options: 'card,banktransfer,ussd,account',
      }),
    })

    const data = await response.json()
    if (data.status !== 'success') return apiError(data.message || 'Payment init failed', 502)

    // Save flutterwave ref on order
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: txRef },
    })

    return ok({ paymentUrl: data.data.link, txRef })
  } catch (err) { return handleError(err) }
}

// GET /api/payments/flutterwave?transactionId=xxx — verify
export async function GET(req: NextRequest) {
  try {
    const txId = req.nextUrl.searchParams.get('transactionId')
    if (!txId) return apiError('transactionId required', 400)

    const { secretKey } = await getFlutterwaveConfig()
    if (!secretKey) return apiError('Flutterwave is not configured. Add keys in Admin → Settings.', 503)

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    const data = await response.json()

    if (data.status !== 'success' || data.data?.status !== 'successful') {
      return apiError('Payment not successful', 400)
    }

    const txRef = data.data.tx_ref
    const order = await prisma.order.findFirst({ where: { paymentRef: txRef } })
    if (!order) return apiError('Order not found for this transaction', 404)
    if (order.paymentStatus === 'paid') return ok({ alreadyPaid: true, orderNumber: order.orderNumber })

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid', status: 'processing', paymentMethod: data.data.payment_type || 'flutterwave' },
      })
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { fulfillmentStatus: 'processing' },
      })
      // Credit vendor balances
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } })
      const vendorEarnings = new Map<string, number>()
      for (const item of items) {
        if (!item.vendorId) continue
        vendorEarnings.set(item.vendorId, (vendorEarnings.get(item.vendorId) || 0) + Number(item.vendorEarning))
      }
      for (const [vendorId, earning] of vendorEarnings) {
        await tx.vendor.update({
          where: { id: vendorId },
          data: { pendingBalance: { increment: earning }, totalSales: { increment: earning }, totalOrders: { increment: 1 } },
        })
      }
    })

    return ok({ success: true, orderNumber: order.orderNumber })
  } catch (err) { return handleError(err) }
}
