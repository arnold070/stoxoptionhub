import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, paginated, handleError, getPagination } from '@/lib/api'

const createSchema = z.object({
  entityType: z.enum(['vendor', 'product', 'order', 'user', 'review']),
  entityId: z.string(),
  reason: z.string().min(5).max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  note: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)
    const resolved = sp.get('resolved') === 'true'
    const entityType = sp.get('entityType')

    const where: any = { isResolved: resolved }
    if (entityType) where.entityType = entityType

    const [flags, total] = await Promise.all([
      prisma.fraudFlag.findMany({
        where, skip, take: limit,
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.fraudFlag.count({ where }),
    ])

    return paginated(flags, page, limit, total)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = createSchema.parse(await req.json())
    const flag = await prisma.fraudFlag.create({ data: body })

    // Auto-actions based on severity
    if (body.severity === 'critical' && body.entityType === 'vendor') {
      await prisma.vendor.update({
        where: { id: body.entityId },
        data: { status: 'suspended', statusNote: `Auto-suspended: ${body.reason}` },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.sub, actorRole: auth.role,
        action: 'fraud_flag_created',
        entityType: body.entityType, entityId: body.entityId,
        meta: { severity: body.severity, reason: body.reason },
      },
    })

    return created(flag)
  } catch (err) { return handleError(err) }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({
      id: z.string(),
      action: z.enum(['resolve', 'escalate']),
      note: z.string().optional(),
    }).parse(await req.json())

    const flag = await prisma.fraudFlag.update({
      where: { id: body.id },
      data: {
        isResolved: body.action === 'resolve',
        resolvedAt: body.action === 'resolve' ? new Date() : undefined,
        resolvedById: body.action === 'resolve' ? auth.sub : undefined,
        note: body.note,
        ...(body.action === 'escalate' && { severity: 'critical' }),
      },
    })

    return ok(flag)
  } catch (err) { return handleError(err) }
}
