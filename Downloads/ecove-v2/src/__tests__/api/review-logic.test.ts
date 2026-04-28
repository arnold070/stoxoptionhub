import { describe, it, expect } from 'vitest'

// ── Review rating calculations ─────────────────────────────
function calcAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((a, b) => a + b, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

function getStarBreakdown(ratings: number[]): Record<number, number> {
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach(r => { if (r >= 1 && r <= 5) breakdown[r]++ })
  return breakdown
}

describe('Review average rating', () => {
  it('empty reviews = 0', () => {
    expect(calcAverageRating([])).toBe(0)
  })
  it('single review', () => {
    expect(calcAverageRating([4])).toBe(4)
  })
  it('multiple reviews', () => {
    expect(calcAverageRating([5, 4, 3, 4, 5])).toBe(4.2)
  })
  it('rounds to 1 decimal place', () => {
    expect(calcAverageRating([1, 2])).toBe(1.5)
    expect(calcAverageRating([1, 2, 3])).toBe(2)
  })
  it('all 5-star', () => {
    expect(calcAverageRating([5, 5, 5])).toBe(5)
  })
  it('all 1-star', () => {
    expect(calcAverageRating([1, 1, 1])).toBe(1)
  })
})

describe('Star breakdown', () => {
  it('counts correctly', () => {
    const bd = getStarBreakdown([5, 5, 4, 3, 1])
    expect(bd[5]).toBe(2)
    expect(bd[4]).toBe(1)
    expect(bd[3]).toBe(1)
    expect(bd[2]).toBe(0)
    expect(bd[1]).toBe(1)
  })
  it('empty ratings', () => {
    const bd = getStarBreakdown([])
    expect(Object.values(bd).every(v => v === 0)).toBe(true)
  })
})

describe('Review moderation states', () => {
  const MODERATION_FLOW = {
    pending:  ['approved', 'rejected', 'flagged'],
    approved: ['flagged'],
    rejected: [],
    flagged:  ['approved', 'rejected'],
  }

  it('pending can be approved', () => {
    expect(MODERATION_FLOW.pending.includes('approved')).toBe(true)
  })
  it('pending can be rejected', () => {
    expect(MODERATION_FLOW.pending.includes('rejected')).toBe(true)
  })
  it('rejected is terminal', () => {
    expect(MODERATION_FLOW.rejected).toHaveLength(0)
  })
  it('flagged can be approved or rejected', () => {
    expect(MODERATION_FLOW.flagged.includes('approved')).toBe(true)
    expect(MODERATION_FLOW.flagged.includes('rejected')).toBe(true)
  })
})
