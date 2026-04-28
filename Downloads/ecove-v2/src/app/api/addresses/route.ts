import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, apiError, handleError } from '@/lib/api'

const schema = z.object({
  firstName:    z.string().min(1).max(50),
  lastName:     z.string().min(1).max(50),
  phone:        z.string().min(7).max(20),
  addressLine1: z.string().min(5).max(255),
  addressLine2: z.string().max(255).optional(),
  city:         z.string().min(2).max(100),
  state:        z.string().min(2).max(100),
  country:      z.string().default('Nigeria'),
  isDefault:    z.boolean().optional(),
})

// GET /api/addresses — list user's saved addresses
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const addresses = await prisma.address.findMany({
      where: { userId: auth.sub },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return ok(addresses)
  } catch (err) { return handleError(err) }
}

// POST /api/addresses — add a new address
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const body = schema.parse(await req.json())

    // If this is the first address or isDefault requested, unset others
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.sub },
        data:  { isDefault: false },
      })
    }

    // If no addresses yet, make this the default
    const count = await prisma.address.count({ where: { userId: auth.sub } })
    const address = await prisma.address.create({
      data: { ...body, userId: auth.sub, isDefault: body.isDefault || count === 0 },
    })
    return created(address)
  } catch (err) { return handleError(err) }
}

// PUT /api/addresses — update an address
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const body = z.object({ id: z.string(), ...schema.shape }).parse(await req.json())
    const { id, ...data } = body

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.sub) return apiError('Address not found', 404)

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.sub, id: { not: id } },
        data:  { isDefault: false },
      })
    }

    const address = await prisma.address.update({ where: { id }, data })
    return ok(address)
  } catch (err) { return handleError(err) }
}

// DELETE /api/addresses — delete an address
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const { id } = z.object({ id: z.string() }).parse(await req.json())

    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.sub) return apiError('Address not found', 404)

    await prisma.address.delete({ where: { id } })

    // If deleted address was default, set the most recent as default
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where:   { userId: auth.sub },
        orderBy: { createdAt: 'desc' },
      })
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }

    return ok({ message: 'Address deleted.' })
  } catch (err) { return handleError(err) }
}
