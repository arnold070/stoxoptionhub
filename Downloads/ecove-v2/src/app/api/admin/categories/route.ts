import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, apiError, handleError } from '@/lib/api'
import { uniqueSlug } from '@/lib/utils'

const schema = z.object({
  name:           z.string().min(2).max(100),
  description:    z.string().max(500).optional(),
  imageUrl:       z.string().url().optional(),
  parentId:       z.string().optional(),
  displayOrder:   z.number().int().min(0).optional(),
  isActive:       z.boolean().optional(),
  metaTitle:      z.string().max(60).optional(),
  metaDescription:z.string().max(160).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        children:  { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count:    { select: { products: true } },
      },
    })
    return ok(categories)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = schema.parse(await req.json())
    const slug = await uniqueSlug(body.name, 'category')
    const cat  = await prisma.category.create({ data: { ...body, slug } })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'category_create', entityType: 'category', entityId: cat.id },
    })
    return created(cat)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({ id: z.string(), ...schema.shape }).parse(await req.json())
    const { id, name, ...rest } = body
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) return apiError('Category not found', 404)
    const slug = name !== existing.name ? await uniqueSlug(name, 'category') : existing.slug
    const cat  = await prisma.category.update({ where: { id }, data: { name, slug, ...rest } })
    return ok(cat)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth  = await requireAuth(req, ['admin', 'super_admin'])
    const { id } = z.object({ id: z.string() }).parse(await req.json())
    await prisma.category.delete({ where: { id } })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'category_delete', entityType: 'category', entityId: id },
    })
    return ok({ message: 'Category deleted.' })
  } catch (err) { return handleError(err) }
}
