import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const user = await prisma.user.findUnique({
      where:  { id: auth.sub },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, avatarUrl: true, isEmailVerified: true, lastLoginAt: true,
        vendor: {
          select: {
            id: true, businessName: true, slug: true, status: true,
            logoUrl: true, availableBalance: true, pendingBalance: true,
            averageRating: true, totalOrders: true,
          }
        }
      },
    })
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}
