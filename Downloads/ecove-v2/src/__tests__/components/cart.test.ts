import { describe, it, expect } from 'vitest'

// ── Cart store logic (pure functions) ──────────────────────
interface CartItem {
  id: string; name: string; price: number; quantity: number; image: string; slug: string
}

function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function calcItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

function updateQty(items: CartItem[], id: string, qty: number): CartItem[] {
  if (qty <= 0) return items.filter(i => i.id !== id)
  return items.map(i => i.id === id ? { ...i, quantity: Math.min(99, qty) } : i)
}

function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find(i => i.id === item.id)
  if (existing) {
    return updateQty(items, item.id, Math.min(99, existing.quantity + item.quantity))
  }
  return [...items, item]
}

const makeItem = (id: string, price: number, qty = 1): CartItem => ({
  id, name: `Product ${id}`, price, quantity: qty, image: '', slug: id,
})

describe('Cart total calculation', () => {
  it('empty cart = ₦0', () => {
    expect(calcTotal([])).toBe(0)
  })
  it('single item', () => {
    expect(calcTotal([makeItem('a', 5000, 2)])).toBe(10000)
  })
  it('multiple items', () => {
    expect(calcTotal([makeItem('a', 5000), makeItem('b', 3000, 3)])).toBe(14000)
  })
})

describe('Cart item count', () => {
  it('counts quantities not items', () => {
    expect(calcItemCount([makeItem('a', 100, 3), makeItem('b', 200, 2)])).toBe(5)
  })
})

describe('Cart quantity update', () => {
  it('updates quantity', () => {
    const items = [makeItem('a', 5000, 1)]
    const updated = updateQty(items, 'a', 3)
    expect(updated[0].quantity).toBe(3)
  })
  it('removes item when qty <= 0', () => {
    const items = [makeItem('a', 5000, 1)]
    expect(updateQty(items, 'a', 0)).toHaveLength(0)
    expect(updateQty(items, 'a', -1)).toHaveLength(0)
  })
  it('caps at 99', () => {
    const items = [makeItem('a', 5000, 1)]
    expect(updateQty(items, 'a', 150)[0].quantity).toBe(99)
  })
})

describe('Add to cart', () => {
  it('adds new item', () => {
    const items = addItem([], makeItem('a', 5000))
    expect(items).toHaveLength(1)
  })
  it('merges duplicate items', () => {
    const items = addItem([makeItem('a', 5000, 2)], makeItem('a', 5000, 1))
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(3)
  })
  it('caps merged quantity at 99', () => {
    const items = addItem([makeItem('a', 5000, 98)], makeItem('a', 5000, 5))
    expect(items[0].quantity).toBe(99)
  })
})
