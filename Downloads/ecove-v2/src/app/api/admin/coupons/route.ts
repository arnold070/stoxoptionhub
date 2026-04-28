import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, handleError } from '@/lib/api'

const schema = z.object({
  code:           z.string().min(3).max(30).toUpperCase(),
  type:           z.enum(['percentage','fixed','free_shipping','buy_x_get_y']),
  value:          z.number().positive().optional(),
  minOrderAmount: z.number().positive().optional(),
  maxUses:        z.number().int().positive().optional(),
  startDate:      z.string().datetime().optional(),
  endDate:        z.string().datetime().optional(),
  isActive:       z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    return ok(coupons)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const body = schema.parse(await req.json())
    const data: any = { ...body }
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate)   data.endDate   = new Date(body.endDate)
    const coupon = await prisma.coupon.create({ data })
    return created(coupon)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({ id: z.string(), ...schema.shape }).parse(await req.json())
    const { id, ...rest } = body
    const data: any = { ...rest }
    if (rest.startDate) data.startDate = new Date(rest.startDate)
    if (rest.endDate)   data.endDate   = new Date(rest.endDate)
    const coupon = await prisma.coupon.update({ where: { id }, data })
    return ok(coupon)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const { id } = z.object({ id: z.string() }).parse(await req.json())
    await prisma.coupon.delete({ where: { id } })
    return ok({ message: 'Coupon deleted.' })
  } catch (err) { return handleError(err) }
}
