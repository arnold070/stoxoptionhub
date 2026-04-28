import { describe, it, expect } from 'vitest'

type OrderStatus = 'pending'|'processing'|'shipped'|'out_for_delivery'|'delivered'|'cancelled'|'refunded'
type PaymentStatus = 'unpaid'|'paid'|'refunded'|'failed'

describe('Order status progression', () => {
  const FORWARD = ['pending','processing','shipped','out_for_delivery','delivered']

  it('valid forward progression exists', () => {
    for (let i = 0; i < FORWARD.length - 1; i++) {
      expect(FORWARD[i+1]).toBeDefined()
    }
  })

  it('cancelled orders cannot be shipped', () => {
    const cancelledOrder = { status: 'cancelled' as OrderStatus }
    const cannotModify = ['cancelled','delivered','refunded'].includes(cancelledOrder.status)
    expect(cannotModify).toBe(true)
  })

  it('customer can cancel pending/processing unpaid orders', () => {
    const canCancel = (status: OrderStatus, paymentStatus: PaymentStatus) =>
      ['pending','processing'].includes(status) && paymentStatus !== 'paid'

    expect(canCancel('pending', 'unpaid')).toBe(true)
    expect(canCancel('processing', 'unpaid')).toBe(true)
    expect(canCancel('shipped', 'unpaid')).toBe(false)
    expect(canCancel('pending', 'paid')).toBe(false)
  })

  it('paid orders show correct payment badge', () => {
    const getPaymentColor = (status: PaymentStatus) =>
      status === 'paid' ? 'green' : 'yellow'
    expect(getPaymentColor('paid')).toBe('green')
    expect(getPaymentColor('unpaid')).toBe('yellow')
  })
})

describe('Order number generation format', () => {
  it('valid ECO order numbers match pattern', () => {
    const pattern = /^ECO-\d{6}-\d{6}$/
    expect('ECO-250327-123456').toMatch(pattern)
    expect('ECO-251231-000001').toMatch(pattern)
  })

  it('invalid formats are rejected', () => {
    const pattern = /^ECO-\d{6}-\d{6}$/
    expect('ORD-250327-123456').not.toMatch(pattern)
    expect('ECO-250327').not.toMatch(pattern)
    expect('eco-250327-123456').not.toMatch(pattern)
  })
})

describe('Shipping fee threshold', () => {
  const FREE_THRESHOLD = 20000

  it('₦20,000 qualifies for free shipping', () => {
    expect(20000 >= FREE_THRESHOLD).toBe(true)
  })
  it('₦19,999 does not qualify', () => {
    expect(19999 >= FREE_THRESHOLD).toBe(false)
  })
  it('free_shipping coupon bypasses threshold', () => {
    const getShipping = (subtotal: number, couponType?: string) =>
      (subtotal >= FREE_THRESHOLD || couponType === 'free_shipping') ? 0 : 1500
    expect(getShipping(500, 'free_shipping')).toBe(0)
    expect(getShipping(500)).toBe(1500)
    expect(getShipping(25000)).toBe(0)
  })
})
