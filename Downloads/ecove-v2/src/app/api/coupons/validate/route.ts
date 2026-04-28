import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (!await rateLimit(`coupon:${ip}`, 20, 10 * 60 * 1000)) {
      return apiError('Too many coupon attempts.', 429)
    }

    const { code, subtotal } = schema.parse(await req.json())
    const now = new Date()

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
    })

    if (!coupon) return apiError('Invalid or expired coupon code.', 400)

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return apiError('This coupon has reached its usage limit.', 400)
    }

    // Check minimum order
    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
      return apiError(
        `Minimum order of ₦${Number(coupon.minOrderAmount).toLocaleString()} required for this coupon.`,
        400
      )
    }

    // Calculate discount
    let discountAmount = 0
    let description = ''

    switch (coupon.type) {
      case 'percentage':
        discountAmount = (subtotal * Number(coupon.value)) / 100
        description = `${coupon.value}% off`
        break
      case 'fixed':
        discountAmount = Math.min(Number(coupon.value), subtotal)
        description = `₦${Number(coupon.value).toLocaleString()} off`
        break
      case 'free_shipping':
        discountAmount = 0
        description = 'Free shipping'
        break
      case 'buy_x_get_y':
        discountAmount = 0
        description = 'Buy X Get Y applied'
        break
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return ok({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description,
      },
      discountAmount,
      newSubtotal: subtotal - discountAmount,
    })
  } catch (err) { return handleError(err) }
}
