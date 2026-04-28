import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

const schema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  description:  z.string().max(1000).optional(),
  tagline:      z.string().max(200).optional(),
  phone:        z.string().optional(),
  whatsapp:     z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().optional(),
  address:      z.string().optional(),
  bankName:     z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({
      where: { userId: auth.sub },
      include: {
        _count: { select: { products: true, orderItems: true, payouts: true } },
      },
    })
    if (!vendor) return apiError('Vendor profile not found', 404)
    return ok(vendor)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['vendor'])
    const body = schema.parse(await req.json())
    const vendor = await prisma.vendor.update({
      where: { userId: auth.sub },
      data:  body,
    })
    return ok(vendor)
  } catch (err) { return handleError(err) }
}
