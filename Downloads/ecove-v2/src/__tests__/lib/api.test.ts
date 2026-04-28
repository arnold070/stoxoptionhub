import { describe, it, expect } from 'vitest'
import { getPagination } from '@/lib/api'

describe('getPagination', () => {
  const sp = (q: string) => new URLSearchParams(q)

  it('defaults to page 1, limit 20', () => {
    const { page, limit, skip } = getPagination(sp(''))
    expect(page).toBe(1)
    expect(limit).toBe(20)
    expect(skip).toBe(0)
  })

  it('parses page and limit correctly', () => {
    const { page, limit, skip } = getPagination(sp('page=3&limit=10'))
    expect(page).toBe(3)
    expect(limit).toBe(10)
    expect(skip).toBe(20)
  })

  it('caps limit at 100', () => {
    const { limit } = getPagination(sp('limit=999'))
    expect(limit).toBe(100)
  })

  it('enforces minimum page of 1', () => {
    const { page } = getPagination(sp('page=-5'))
    expect(page).toBe(1)
  })

  it('enforces minimum limit of 1', () => {
    const { limit } = getPagination(sp('limit=0'))
    expect(limit).toBe(1)
  })

  it('computes skip correctly for various pages', () => {
    expect(getPagination(sp('page=1&limit=25')).skip).toBe(0)
    expect(getPagination(sp('page=2&limit=25')).skip).toBe(25)
    expect(getPagination(sp('page=5&limit=10')).skip).toBe(40)
  })

  it('handles non-numeric values gracefully', () => {
    const { page, limit } = getPagination(sp('page=abc&limit=xyz'))
    expect(page).toBe(1)
    expect(limit).toBe(20)
  })
})
