import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginated, ok, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const search = sp.get('q') || ''
    const role = sp.get('role') || 'customer'

    const where: any = {}
    if (role !== 'all') where.role = role
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phone: true, role: true, isActive: true, isEmailVerified: true,
          lastLoginAt: true, createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            where:  { paymentStatus: 'paid' },
            select: { total: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Compute total spent per user from their paid orders
    const usersWithSpend = users.map(u => ({
      ...u,
      totalSpent: u.orders.reduce((sum: number, o: any) => sum + Number(o.total), 0),
      orders: undefined, // strip raw orders array from response
    }))

    return paginated(usersWithSpend, page, limit, total)
  } catch (err) { return handleError(err) }
}

// PATCH /api/admin/customers — deactivate / reactivate a user
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({
      id: z.string(),
      action: z.enum(['activate', 'deactivate']),
    }).parse(await req.json())

    const updated = await prisma.user.update({
      where: { id: body.id },
      data: { isActive: body.action === 'activate' },
      select: { id: true, email: true, isActive: true },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.sub, actorRole: auth.role,
        action: `user_${body.action}`,
        entityType: 'user', entityId: body.id,
      },
    })

    return ok(updated)
  } catch (err) { return handleError(err) }
}
