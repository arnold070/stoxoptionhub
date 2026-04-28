import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import logger from '@/lib/logger'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'
import { sendPayoutApproved, sendPayoutPaid } from '@/lib/email'

const schema = z.object({
  action:      z.enum(['approve', 'reject', 'mark_paid']),
  adminNote:   z.string().max(500).optional(),
  transferRef: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = schema.parse(await req.json())

    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: { vendor: { include: { user: { select: { email: true } } } } },
    })
    if (!payout) return apiError('Payout not found', 404)

    const statusMap = { approve: 'approved', reject: 'rejected', mark_paid: 'paid' }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.update({
        where: { id: params.id },
        data: {
          status:        statusMap[body.action] as any,
          adminNote:     body.adminNote,
          transferRef:   body.transferRef,
          processedAt:   new Date(),
          processedById: auth.sub,
        },
      })

      // Deduct from vendor available balance when marked paid
      if (body.action === 'mark_paid') {
        await tx.vendor.update({
          where: { id: payout.vendorId },
          data: {
            pendingBalance: { decrement: payout.amount },
            lifetimePaid:   { increment: payout.amount },
          },
        })
        // Mark related order items as paid
        await tx.orderItem.updateMany({
          where: { payoutId: params.id },
          data:  { payoutStatus: 'paid' },
        })
      }

      // Reject: release balance back to available
      if (body.action === 'reject') {
        await tx.vendor.update({
          where: { id: payout.vendorId },
          data: {
            pendingBalance:   { decrement: payout.amount },
            availableBalance: { increment: payout.amount },
          },
        })
      }

      return p
    })

    // Emails
    const email = payout.vendor.user.email
    const biz   = payout.vendor.businessName
    const amt   = payout.amount.toFixed(2)
    if (body.action === 'approve')   await sendPayoutApproved(email, biz, amt).catch(() => {})
    if (body.action === 'mark_paid') await sendPayoutPaid(email, biz, amt, body.transferRef || 'N/A').catch(() => {})

    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: `payout_${body.action}`, entityType: 'payout', entityId: params.id, meta: body },
    })

    return ok(updated)
  } catch (err) { return handleError(err) }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { id: true, businessName: true, bankName: true, bankAccountNumber: true, bankAccountName: true } },
        items:  { select: { id: true, productName: true, totalPrice: true, commissionAmt: true, vendorEarning: true } },
      },
    })
    if (!payout) return apiError('Payout not found', 404)
    return ok(payout)
  } catch (err) { return handleError(err) }
}
