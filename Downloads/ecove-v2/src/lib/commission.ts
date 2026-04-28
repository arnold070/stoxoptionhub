import prisma from './prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Resolve commission rate for a given vendor + category.
 * Priority: vendor-specific > category > global > default 10%
 */
export async function resolveCommissionRate(
  vendorId: string,
  categoryId?: string | null
): Promise<Decimal> {
  // 1. Vendor-specific override
  const vendorRule = await prisma.commissionRule.findFirst({
    where: { type: 'vendor', vendorId, isActive: true },
  })
  if (vendorRule) return vendorRule.rate

  // 2. Vendor table direct rate
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { commissionRate: true },
  })
  if (vendor?.commissionRate) return vendor.commissionRate

  // 3. Category rule
  if (categoryId) {
    const catRule = await prisma.commissionRule.findFirst({
      where: { type: 'category', categoryId, isActive: true },
    })
    if (catRule) return catRule.rate
  }

  // 4. Global rule
  const globalRule = await prisma.commissionRule.findFirst({
    where: { type: 'global', isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  if (globalRule) return globalRule.rate

  // 5. Hardcoded default
  return new Decimal(10)
}

export function calcCommission(price: Decimal, rate: Decimal): {
  commissionAmt: Decimal
  vendorEarning: Decimal
} {
  const commissionAmt = price.mul(rate).div(100).toDecimalPlaces(2)
  const vendorEarning = price.minus(commissionAmt).toDecimalPlaces(2)
  return { commissionAmt, vendorEarning }
}
