import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Zod schemas mirroring API validators ───────────────────

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50),
  email:     z.string().email(),
  password:  z.string().min(8).max(100),
  phone:     z.string().optional(),
})

const addressSchema = z.object({
  firstName:    z.string().min(1),
  lastName:     z.string().min(1),
  phone:        z.string().min(7),
  addressLine1: z.string().min(5),
  city:         z.string().min(2),
  state:        z.string().min(2),
  country:      z.string().default('Nigeria'),
})

const productSchema = z.object({
  name:  z.string().min(2).max(255),
  price: z.number().positive(),
  stock: z.number().int().min(0),
})

describe('Register schema validation', () => {
  const valid = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password: 'Password123' }

  it('accepts valid data', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow()
  })
  it('rejects short firstName', () => {
    expect(() => registerSchema.parse({ ...valid, firstName: 'A' })).toThrow()
  })
  it('rejects invalid email', () => {
    expect(() => registerSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
  })
  it('rejects short password', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'abc' })).toThrow()
  })
  it('phone is optional', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow()
  })
})

describe('Address schema validation', () => {
  const valid = {
    firstName: 'Ada', lastName: 'Lovelace',
    phone: '08012345678', addressLine1: '12 Marina Street',
    city: 'Lagos', state: 'Lagos',
  }

  it('accepts valid address', () => {
    expect(() => addressSchema.parse(valid)).not.toThrow()
  })
  it('defaults country to Nigeria', () => {
    const result = addressSchema.parse(valid)
    expect(result.country).toBe('Nigeria')
  })
  it('rejects short phone', () => {
    expect(() => addressSchema.parse({ ...valid, phone: '080' })).toThrow()
  })
  it('rejects short address line', () => {
    expect(() => addressSchema.parse({ ...valid, addressLine1: 'A' })).toThrow()
  })
})

describe('Product schema validation', () => {
  it('accepts valid product', () => {
    expect(() => productSchema.parse({ name: 'iPhone 15', price: 1200000, stock: 10 })).not.toThrow()
  })
  it('rejects zero price', () => {
    expect(() => productSchema.parse({ name: 'Test', price: 0, stock: 5 })).toThrow()
  })
  it('rejects negative stock', () => {
    expect(() => productSchema.parse({ name: 'Test', price: 1000, stock: -1 })).toThrow()
  })
  it('allows zero stock (out of stock)', () => {
    expect(() => productSchema.parse({ name: 'Test', price: 1000, stock: 0 })).not.toThrow()
  })
  it('rejects very short name', () => {
    expect(() => productSchema.parse({ name: 'X', price: 1000, stock: 5 })).toThrow()
  })
})
