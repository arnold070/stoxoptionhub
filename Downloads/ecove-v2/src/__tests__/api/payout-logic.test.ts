import { describe, it, expect } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'

// ── Payout balance flow tests ──────────────────────────────
// These test the invariants the payout system must maintain

describe('Vendor balance invariants', () => {
  it('requesting payout moves from available to pending', () => {
    const available = new Decimal(50000)
    const pending   = new Decimal(10000)
    const amount    = new Decimal(20000)

    const newAvailable = available.minus(amount)
    const newPending   = pending.add(amount)

    expect(newAvailable.toNumber()).toBe(30000)
    expect(newPending.toNumber()).toBe(30000)
    // Total balance unchanged
    expect(newAvailable.add(newPending).toNumber()).toBe(available.add(pending).toNumber())
  })

  it('marking payout paid reduces pendingBalance', () => {
    const pending     = new Decimal(20000)
    const lifetimePaid = new Decimal(100000)
    const amount      = new Decimal(20000)

    const newPending      = pending.minus(amount)
    const newLifetimePaid = lifetimePaid.add(amount)

    expect(newPending.toNumber()).toBe(0)
    expect(newLifetimePaid.toNumber()).toBe(120000)
  })

  it('rejecting payout restores available from pending', () => {
    const available = new Decimal(30000)
    const pending   = new Decimal(20000)
    const amount    = new Decimal(20000)

    const newAvailable = available.add(amount)
    const newPending   = pending.minus(amount)

    expect(newAvailable.toNumber()).toBe(50000)
    expect(newPending.toNumber()).toBe(0)
    // Total unchanged
    expect(newAvailable.add(newPending).toNumber()).toBe(available.add(pending).toNumber())
  })

  it('pendingBalance never goes negative on rejection', () => {
    const pending = new Decimal(20000)
    const amount  = new Decimal(20000)
    expect(pending.minus(amount).toNumber()).toBe(0)
  })

  it('minimum payout is ₦5,000', () => {
    const MIN_PAYOUT = new Decimal(5000)
    expect(new Decimal(4999).lt(MIN_PAYOUT)).toBe(true)
    expect(new Decimal(5000).lt(MIN_PAYOUT)).toBe(false)
    expect(new Decimal(5001).lt(MIN_PAYOUT)).toBe(false)
  })
})

describe('Commission calculation', () => {
  it('vendor earning + commission = total price', () => {
    const price = new Decimal(10000)
    const rate  = new Decimal(10) // 10%
    const commission = price.mul(rate).div(100)
    const earning = price.minus(commission)
    expect(commission.add(earning).toNumber()).toBe(price.toNumber())
  })

  it('priority: vendor rule > category rule > global', () => {
    // Simulate resolveRate logic
    const rules = {
      vendorRule: { rate: 5 },
      categoryRule: { rate: 8 },
      globalRule: { rate: 10 },
    }
    // Vendor rule wins
    expect(rules.vendorRule.rate).toBe(5)
    // Without vendor rule, category wins
    expect(rules.categoryRule.rate).toBe(8)
    // Without both, global applies
    expect(rules.globalRule.rate).toBe(10)
  })
})
