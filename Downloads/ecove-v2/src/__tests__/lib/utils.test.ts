import { describe, it, expect } from 'vitest'
import { slugify, generateOrderNumber, generateToken } from '@/lib/utils'

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Samsung Galaxy')).toBe('samsung-galaxy')
  })
  it('replaces spaces with hyphens', () => {
    expect(slugify('iPhone 15 Pro Max')).toBe('iphone-15-pro-max')
  })
  it('removes special characters', () => {
    expect(slugify('Product! @#$%')).toBe('product')
  })
  it('collapses multiple hyphens', () => {
    expect(slugify('a  --  b')).toBe('a-b')
  })
  it('trims leading/trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })
  it('handles Nigerian brand names', () => {
    expect(slugify("Innoson IVM G5 4×4")).toBe('innoson-ivm-g5-44')
  })
})

describe('generateOrderNumber', () => {
  it('starts with ECO-', () => {
    expect(generateOrderNumber()).toMatch(/^ECO-/)
  })
  it('has correct format ECO-YYMMDD-XXXXXX', () => {
    expect(generateOrderNumber()).toMatch(/^ECO-\d{6}-\d{6}$/)
  })
  it('generates unique numbers', () => {
    const nums = new Set(Array.from({ length: 100 }, () => generateOrderNumber()))
    expect(nums.size).toBeGreaterThan(95) // allow tiny collision chance
  })
  it('uses current date', () => {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    expect(generateOrderNumber()).toMatch(new RegExp(`^ECO-${yy}${mm}${dd}-`))
  })
})

describe('generateToken', () => {
  it('generates hex string', () => {
    expect(generateToken()).toMatch(/^[0-9a-f]+$/)
  })
  it('default length is 64 hex chars (32 bytes)', () => {
    expect(generateToken()).toHaveLength(64)
  })
  it('respects custom byte length', () => {
    expect(generateToken(16)).toHaveLength(32)
  })
  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()))
    expect(tokens.size).toBe(50)
  })
})
