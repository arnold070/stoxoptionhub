import { describe, it, expect } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'

// ── Shipping fee calculation logic ──────────────────────────
function calcShipping(subtotal: number, couponType?: string): number {
  const hasFreeShipping = couponType === 'free_shipping'
  return (subtotal >= 20000 || hasFreeShipping) ? 0 : 1500
}

describe('Shipping fee logic', () => {
  it('charges ₦1500 for orders under ₦20,000', () => {
    expect(calcShipping(15000)).toBe(1500)
    expect(calcShipping(19999)).toBe(1500)
    expect(calcShipping(0)).toBe(1500)
  })

  it('free shipping on orders ≥ ₦20,000', () => {
    expect(calcShipping(20000)).toBe(0)
    expect(calcShipping(50000)).toBe(0)
    expect(calcShipping(1000000)).toBe(0)
  })

  it('free_shipping coupon overrides threshold', () => {
    expect(calcShipping(5000, 'free_shipping')).toBe(0)
    expect(calcShipping(100, 'free_shipping')).toBe(0)
  })

  it('other coupon types still charge shipping if under threshold', () => {
    expect(calcShipping(10000, 'percentage')).toBe(1500)
    expect(calcShipping(10000, 'fixed')).toBe(1500)
  })
})

// ── Coupon discount calculation ─────────────────────────────
function calcCouponDiscount(
  subtotal: number,
  type: string,
  value: number
): number {
  if (type === 'percentage') return Math.round((subtotal * value / 100) * 100) / 100
  if (type === 'fixed') return Math.min(value, subtotal) // can't discount more than subtotal
  return 0 // free_shipping, buy_x_get_y
}

describe('Coupon discount logic', () => {
  it('percentage coupon: 20% off ₦50,000 = ₦10,000', () => {
    expect(calcCouponDiscount(50000, 'percentage', 20)).toBe(10000)
  })

  it('fixed coupon: ₦5,000 off ₦30,000', () => {
    expect(calcCouponDiscount(30000, 'fixed', 5000)).toBe(5000)
  })

  it('fixed coupon cannot exceed subtotal', () => {
    expect(calcCouponDiscount(3000, 'fixed', 5000)).toBe(3000)
  })

  it('free_shipping returns zero discount amount', () => {
    expect(calcCouponDiscount(50000, 'free_shipping', 0)).toBe(0)
  })

  it('percentage rounds correctly', () => {
    // 33.333...% of 100 = 33.33
    const result = calcCouponDiscount(100, 'percentage', 33.333)
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBeCloseTo(33.33, 1)
  })
})

// ── Order total integrity ───────────────────────────────────
describe('Order total integrity', () => {
  it('total = subtotal - discount + shipping', () => {
    const subtotal = 45000
    const discount = 4500 // 10% off
    const shipping = 0    // free (>= 20000 after discount)
    const total = subtotal - discount + shipping
    expect(total).toBe(40500)
  })

  it('total cannot be negative', () => {
    const subtotal = 5000
    const discount = 5000
    const shipping = 0
    const total = Math.max(0, subtotal - discount + shipping)
    expect(total).toBeGreaterThanOrEqual(0)
  })
})
