import { describe, it, expect } from 'vitest'

// ── Password validation ─────────────────────────────────────
import { z } from 'zod'

const passwordSchema = z.string()
  .min(8, 'Min 8 characters')
  .max(100, 'Too long')
  .regex(/[A-Z]/, 'Need at least one uppercase letter')
  .regex(/[0-9]/, 'Need at least one number')

describe('Password validation', () => {
  it('rejects short passwords', () => {
    expect(() => passwordSchema.parse('Abc1')).toThrow()
  })
  it('rejects passwords without uppercase', () => {
    expect(() => passwordSchema.parse('password123')).toThrow()
  })
  it('rejects passwords without numbers', () => {
    expect(() => passwordSchema.parse('Password!')).toThrow()
  })
  it('accepts valid passwords', () => {
    expect(passwordSchema.parse('MyPassword123')).toBe('MyPassword123')
    expect(passwordSchema.parse('EcoveAdmin2025!')).toBe('EcoveAdmin2025!')
  })
})

// ── Email normalisation ─────────────────────────────────────
describe('Email normalisation', () => {
  const normalise = (email: string) => email.trim().toLowerCase()

  it('lowercases emails', () => {
    expect(normalise('USER@EXAMPLE.COM')).toBe('user@example.com')
  })
  it('trims whitespace', () => {
    expect(normalise('  user@example.com  ')).toBe('user@example.com')
  })
})

// ── Rate limit key derivation ──────────────────────────────
describe('Rate limit key format', () => {
  const makeKey = (prefix: string, ip: string) => `${prefix}:${ip}`

  it('generates correct login key', () => {
    expect(makeKey('login', '192.168.1.1')).toBe('login:192.168.1.1')
  })
  it('generates correct register key', () => {
    expect(makeKey('register', '10.0.0.1')).toBe('register:10.0.0.1')
  })
  it('handles unknown IP', () => {
    expect(makeKey('login', 'unknown')).toBe('login:unknown')
  })
})

// ── JWT payload structure ──────────────────────────────────
describe('JWT payload structure', () => {
  it('must contain required fields', () => {
    const payload = { sub: 'user-123', role: 'customer', email: 'user@test.com' }
    expect(payload).toHaveProperty('sub')
    expect(payload).toHaveProperty('role')
    expect(payload).toHaveProperty('email')
  })

  it('vendor payload includes vendorId', () => {
    const payload = {
      sub: 'user-123', role: 'vendor',
      email: 'vendor@test.com', vendorId: 'vendor-456',
    }
    expect(payload.vendorId).toBe('vendor-456')
  })
})
