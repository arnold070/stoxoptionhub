import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { created, apiError, paginated, handleError, getPagination } from '@/lib/api'
import { Decimal } from '@prisma/client/runtime/library'

const MIN_PAYOUT = new Decimal(5000)

export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where: { vendorId: vendor.id }, skip, take: limit,
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.payout.count({ where: { vendorId: vendor.id } }),
    ])

    return paginated(payouts, page, limit, total)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub } })
    if (!vendor) return apiError('Vendor not found', 404)

    const body = z.object({ amount: z.number().positive(), note: z.string().max(200).optional() }).parse(await req.json())
    const amount = new Decimal(body.amount)

    if (amount.lt(MIN_PAYOUT)) return apiError(`Minimum payout is ₦${MIN_PAYOUT.toFixed(0)}.`, 400)
    if (amount.gt(vendor.availableBalance)) return apiError('Insufficient available balance.', 400)
    if (!vendor.bankName || !vendor.bankAccountNumber) return apiError('Please add bank details before requesting a payout.', 400)

    // Check no pending payout already
    const pending = await prisma.payout.findFirst({ where: { vendorId: vendor.id, status: 'pending' } })
    if (pending) return apiError('You already have a pending withdrawal request.', 409)

    // Get eligible order items (delivered, not yet paid out)
    const now = new Date()
    const clearDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 day hold
    const eligibleItems = await prisma.orderItem.findMany({
      where: {
        vendorId:          vendor.id,
        payoutStatus:      'pending',
        payoutId:          null,
        deliveredAt:       { lte: clearDate },
        fulfillmentStatus: 'delivered',
      },
    })

    const payout = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          vendorId:          vendor.id,
          amount,
          periodStart:       eligibleItems.length > 0 ? eligibleItems[eligibleItems.length - 1].createdAt : now,
          periodEnd:         now,
          bankName:          vendor.bankName!,
          bankAccountNumber: vendor.bankAccountNumber!,
          bankAccountName:   vendor.bankAccountName!,
          status:            'pending',
        },
      })
      // Link order items to this payout
      if (eligibleItems.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: eligibleItems.map(i => i.id) } },
          data:  { payoutId: p.id, payoutStatus: 'approved' },
        })
      }
      // Move amount from available to pending (held during review)
      await tx.vendor.update({
        where: { id: vendor.id },
        data:  { availableBalance: { decrement: amount }, pendingBalance: { increment: amount } },
      })
      return p
    })

    return created(payout)
  } catch (err) { return handleError(err) }
}
