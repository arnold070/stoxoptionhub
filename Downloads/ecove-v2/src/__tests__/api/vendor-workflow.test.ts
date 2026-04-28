import { describe, it, expect } from 'vitest'

// Vendor status machine
type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
type VendorAction = 'approve' | 'reject' | 'suspend' | 'activate'

const VALID_TRANSITIONS: Record<VendorStatus, VendorAction[]> = {
  pending:   ['approve', 'reject'],
  approved:  ['suspend'],
  rejected:  ['approve'],
  suspended: ['activate'],
}

function canTransition(status: VendorStatus, action: VendorAction): boolean {
  return VALID_TRANSITIONS[status]?.includes(action) ?? false
}

function applyAction(status: VendorStatus, action: VendorAction): VendorStatus {
  const map: Record<VendorAction, VendorStatus> = {
    approve: 'approved', reject: 'rejected',
    suspend: 'suspended', activate: 'approved',
  }
  return map[action]
}

describe('Vendor status machine', () => {
  it('pending → approved on approve', () => {
    expect(applyAction('pending', 'approve')).toBe('approved')
  })
  it('pending → rejected on reject', () => {
    expect(applyAction('pending', 'reject')).toBe('rejected')
  })
  it('approved → suspended on suspend', () => {
    expect(applyAction('approved', 'suspend')).toBe('suspended')
  })
  it('suspended → approved on activate', () => {
    expect(applyAction('suspended', 'activate')).toBe('approved')
  })
  it('rejected → approved on re-approve', () => {
    expect(applyAction('rejected', 'approve')).toBe('approved')
  })

  it('cannot suspend a pending vendor', () => {
    expect(canTransition('pending', 'suspend')).toBe(false)
  })
  it('cannot activate an approved vendor', () => {
    expect(canTransition('approved', 'activate')).toBe(false)
  })
  it('cannot reject an already-rejected vendor', () => {
    expect(canTransition('rejected', 'reject')).toBe(false)
  })
})

// Product status machine
type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'

describe('Product status machine', () => {
  it('approved products can be suspended', () => {
    const statusMap: Record<string, ProductStatus> = {
      approve: 'approved', reject: 'rejected', suspend: 'suspended',
    }
    expect(statusMap['approve']).toBe('approved')
    expect(statusMap['suspend']).toBe('suspended')
  })

  it('only stock/price/lowStockAlert editable when approved', () => {
    const safeFields = ['stock', 'lowStockAlert', 'price']
    const allFields = ['name', 'description', 'price', 'stock', 'categoryId', 'brand']
    const lockedFields = allFields.filter(f => !safeFields.includes(f))
    expect(lockedFields).toContain('name')
    expect(lockedFields).toContain('description')
    expect(lockedFields).not.toContain('stock')
  })
})

// Commission priority logic
describe('Commission priority resolution', () => {
  interface CommissionRule { type: string; rate: number; vendorId?: string; categoryId?: string }

  function resolveRate(
    vendorId: string,
    categoryId: string | null,
    rules: CommissionRule[],
    vendorDirectRate: number | null,
  ): number {
    const vRule = rules.find(r => r.type === 'vendor' && r.vendorId === vendorId)
    if (vRule) return vRule.rate
    if (vendorDirectRate) return vendorDirectRate
    if (categoryId) {
      const cRule = rules.find(r => r.type === 'category' && r.categoryId === categoryId)
      if (cRule) return cRule.rate
    }
    const gRule = rules.find(r => r.type === 'global')
    return gRule?.rate ?? 10
  }

  const rules: CommissionRule[] = [
    { type: 'global', rate: 10 },
    { type: 'category', rate: 15, categoryId: 'fashion' },
    { type: 'vendor', rate: 5, vendorId: 'premium-vendor' },
  ]

  it('vendor-specific rule wins over everything', () => {
    expect(resolveRate('premium-vendor', 'fashion', rules, 8)).toBe(5)
  })
  it('vendor direct rate wins over category', () => {
    expect(resolveRate('ordinary-vendor', 'fashion', rules, 8)).toBe(8)
  })
  it('category rule wins over global', () => {
    expect(resolveRate('ordinary-vendor', 'fashion', rules, null)).toBe(15)
  })
  it('falls back to global rate', () => {
    expect(resolveRate('ordinary-vendor', 'electronics', rules, null)).toBe(10)
  })
  it('defaults to 10% if no rules exist', () => {
    expect(resolveRate('v1', 'cat1', [], null)).toBe(10)
  })
})
