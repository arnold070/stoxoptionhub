import { describe, it, expect } from 'vitest'

type CouponType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y'

interface Coupon {
  code: string; type: CouponType; value?: number
  minOrderAmount?: number; maxUses?: number; usedCount: number
  startDate?: Date; endDate?: Date; isActive: boolean
}

function validateCoupon(coupon: Coupon | null, subtotal: number, now = new Date()): string | null {
  if (!coupon) return 'Invalid or expired coupon code.'
  if (!coupon.isActive) return 'Invalid or expired coupon code.'
  if (coupon.startDate && now < coupon.startDate) return 'Invalid or expired coupon code.'
  if (coupon.endDate && now > coupon.endDate) return 'Invalid or expired coupon code.'
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return 'This coupon has reached its usage limit.'
  }
  if (coupon.minOrderAmount !== undefined && subtotal < coupon.minOrderAmount) {
    return `Minimum order of ₦${coupon.minOrderAmount.toLocaleString()} required.`
  }
  return null // valid
}

function applyDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === 'percentage' && coupon.value) {
    return Math.round((subtotal * coupon.value / 100) * 100) / 100
  }
  if (coupon.type === 'fixed' && coupon.value) {
    return Math.min(coupon.value, subtotal)
  }
  return 0
}

const validCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  code: 'SAVE10', type: 'percentage', value: 10,
  usedCount: 0, isActive: true, ...overrides,
})

describe('Coupon validation', () => {
  it('null coupon returns error', () => {
    expect(validateCoupon(null, 10000)).toBeTruthy()
  })

  it('inactive coupon is rejected', () => {
    expect(validateCoupon(validCoupon({ isActive: false }), 10000)).toBeTruthy()
  })

  it('future startDate coupon is rejected', () => {
    const future = new Date(Date.now() + 86400000)
    expect(validateCoupon(validCoupon({ startDate: future }), 10000)).toBeTruthy()
  })

  it('past endDate coupon is rejected', () => {
    const past = new Date(Date.now() - 86400000)
    expect(validateCoupon(validCoupon({ endDate: past }), 10000)).toBeTruthy()
  })

  it('exhausted coupon is rejected', () => {
    const c = validateCoupon(validCoupon({ maxUses: 100, usedCount: 100 }), 10000)
    expect(c).toContain('usage limit')
  })

  it('below minimum order amount is rejected', () => {
    const c = validateCoupon(validCoupon({ minOrderAmount: 20000 }), 10000)
    expect(c).toContain('Minimum order')
  })

  it('valid coupon returns null (no error)', () => {
    expect(validateCoupon(validCoupon(), 10000)).toBeNull()
  })

  it('valid coupon with future end date is accepted', () => {
    const future = new Date(Date.now() + 86400000)
    expect(validateCoupon(validCoupon({ endDate: future }), 10000)).toBeNull()
  })
})

describe('Coupon discount application', () => {
  it('10% off ₦50,000 = ₦5,000', () => {
    expect(applyDiscount(validCoupon({ type: 'percentage', value: 10 }), 50000)).toBe(5000)
  })

  it('fixed ₦2,000 off ₦15,000', () => {
    expect(applyDiscount(validCoupon({ type: 'fixed', value: 2000 }), 15000)).toBe(2000)
  })

  it('fixed discount capped at subtotal', () => {
    expect(applyDiscount(validCoupon({ type: 'fixed', value: 20000 }), 5000)).toBe(5000)
  })

  it('free_shipping returns 0 discount amount', () => {
    expect(applyDiscount(validCoupon({ type: 'free_shipping' }), 10000)).toBe(0)
  })

  it('100% percentage = full discount', () => {
    expect(applyDiscount(validCoupon({ type: 'percentage', value: 100 }), 10000)).toBe(10000)
  })
})
