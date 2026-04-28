import { describe, it, expect } from 'vitest'
import type { OrderStatus } from '@/types'

// ── Order status machine ───────────────────────────────────
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending:          ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered:        ['refunded'],
  cancelled:        [],
  refunded:         [],
}

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to)
}

const STATUS_STEPS: OrderStatus[] = [
  'pending', 'processing', 'shipped', 'out_for_delivery', 'delivered',
]

describe('Order status transitions', () => {
  it('pending → processing allowed', () => {
    expect(canTransition('pending', 'processing')).toBe(true)
  })
  it('pending → cancelled allowed', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true)
  })
  it('pending → shipped NOT allowed (must process first)', () => {
    expect(canTransition('pending', 'shipped')).toBe(false)
  })
  it('delivered → refunded allowed', () => {
    expect(canTransition('delivered', 'refunded')).toBe(true)
  })
  it('cancelled → any NOT allowed (terminal)', () => {
    expect(canTransition('cancelled', 'processing')).toBe(false)
    expect(canTransition('cancelled', 'shipped')).toBe(false)
  })
  it('refunded is terminal', () => {
    expect(canTransition('refunded', 'delivered')).toBe(false)
  })
})

describe('Order progress tracker', () => {
  it('pending is first step (index 0)', () => {
    expect(STATUS_STEPS.indexOf('pending')).toBe(0)
  })
  it('delivered is last step', () => {
    expect(STATUS_STEPS.indexOf('delivered')).toBe(STATUS_STEPS.length - 1)
  })
  it('cancelled and refunded are not in progress bar', () => {
    expect(STATUS_STEPS.includes('cancelled' as OrderStatus)).toBe(false)
    expect(STATUS_STEPS.includes('refunded' as OrderStatus)).toBe(false)
  })
  it('steps are in correct order', () => {
    const idx = (s: OrderStatus) => STATUS_STEPS.indexOf(s)
    expect(idx('pending')).toBeLessThan(idx('processing'))
    expect(idx('processing')).toBeLessThan(idx('shipped'))
    expect(idx('shipped')).toBeLessThan(idx('out_for_delivery'))
    expect(idx('out_for_delivery')).toBeLessThan(idx('delivered'))
  })
})

describe('Customer cancellation eligibility', () => {
  const cancellable: OrderStatus[] = ['pending', 'processing']

  it('pending can be cancelled by customer', () => {
    expect(cancellable.includes('pending')).toBe(true)
  })
  it('processing can be cancelled by customer', () => {
    expect(cancellable.includes('processing')).toBe(true)
  })
  it('shipped cannot be cancelled', () => {
    expect(cancellable.includes('shipped')).toBe(false)
  })
  it('delivered cannot be cancelled', () => {
    expect(cancellable.includes('delivered')).toBe(false)
  })
})
