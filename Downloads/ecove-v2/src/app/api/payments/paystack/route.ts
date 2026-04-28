import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import crypto from 'crypto'
import { getPaystackConfig } from '@/lib/config'

// POST /api/payments/paystack — verify payment after redirect
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'No reference provided' }, { status: 400 })

  try {
    const { secretKey } = await getPaystackConfig()
    const response = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    const data = await response.json()

    if (data.data?.status === 'success') {
      // NOTE: Do NOT update DB here. The Paystack webhook is the authoritative handler.
      // Updating here would mark paymentStatus='paid' BEFORE the webhook fires,
      // causing the webhook's idempotency check to skip stock decrement and vendor crediting.
      // The confirm page polls this endpoint only to show the user their payment status.
      return NextResponse.json({ success: true, status: 'paid' })
    }

    return NextResponse.json({ success: false, status: data.data?.status || 'unknown' })
  } catch (err) {
    logger.error('[Paystack verify]', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
