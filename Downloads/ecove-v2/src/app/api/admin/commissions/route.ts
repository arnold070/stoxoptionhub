import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, handleError } from '@/lib/api'

const schema = z.object({
  type:       z.enum(['global', 'category', 'vendor']),
  rate:       z.number().min(0).max(100),
  categoryId: z.string().optional(),
  vendorId:   z.string().optional(),
  note:       z.string().max(200).optional(),
  isActive:   z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const rules = await prisma.commissionRule.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    })
    return ok(rules)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = schema.parse(await req.json())
    const rule = await prisma.commissionRule.create({ data: body as any })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'commission_create', entityType: 'commission_rule', entityId: rule.id, meta: body },
    })
    return created(rule)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({ id: z.string(), ...schema.shape }).parse(await req.json())
    const { id, ...data } = body
    const rule = await prisma.commissionRule.update({ where: { id }, data: data as any })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'commission_update', entityType: 'commission_rule', entityId: id, meta: data },
    })
    return ok(rule)
  } catch (err) { return handleError(err) }
}
