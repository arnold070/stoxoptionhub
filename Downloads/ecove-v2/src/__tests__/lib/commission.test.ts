import { describe, it, expect } from 'vitest'
import { calcCommission } from '@/lib/commission'
import { Decimal } from '@prisma/client/runtime/library'

describe('calcCommission', () => {
  it('computes 10% commission correctly', () => {
    const price = new Decimal(10000)
    const rate  = new Decimal(10)
    const { commissionAmt, vendorEarning } = calcCommission(price, rate)
    expect(commissionAmt.toNumber()).toBe(1000)
    expect(vendorEarning.toNumber()).toBe(9000)
  })

  it('computes 8% commission on electronics', () => {
    const price = new Decimal(50000)
    const rate  = new Decimal(8)
    const { commissionAmt, vendorEarning } = calcCommission(price, rate)
    expect(commissionAmt.toNumber()).toBe(4000)
    expect(vendorEarning.toNumber()).toBe(46000)
  })

  it('commissionAmt + vendorEarning = price', () => {
    const price = new Decimal(285000)
    const rate  = new Decimal(12.5)
    const { commissionAmt, vendorEarning } = calcCommission(price, rate)
    expect(commissionAmt.add(vendorEarning).toNumber()).toBe(price.toNumber())
  })

  it('rounds to 2 decimal places', () => {
    const price = new Decimal(100)
    const rate  = new Decimal(33.333)
    const { commissionAmt } = calcCommission(price, rate)
    expect(commissionAmt.decimalPlaces()).toBeLessThanOrEqual(2)
  })

  it('handles zero price', () => {
    const price = new Decimal(0)
    const rate  = new Decimal(10)
    const { commissionAmt, vendorEarning } = calcCommission(price, rate)
    expect(commissionAmt.toNumber()).toBe(0)
    expect(vendorEarning.toNumber()).toBe(0)
  })

  it('handles 100% commission (edge case)', () => {
    const price = new Decimal(5000)
    const rate  = new Decimal(100)
    const { commissionAmt, vendorEarning } = calcCommission(price, rate)
    expect(commissionAmt.toNumber()).toBe(5000)
    expect(vendorEarning.toNumber()).toBe(0)
  })
})
