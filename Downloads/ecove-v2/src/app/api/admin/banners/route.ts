import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, handleError } from '@/lib/api'

const bannerSchema = z.object({
  title:        z.string().min(2).max(100),
  subtitle:     z.string().max(200).optional(),
  ctaText:      z.string().max(50).optional(),
  ctaLink:      z.string().max(255).optional(),
  imageUrl:     z.string().url().optional(),
  position:     z.enum(['hero_slider','side_card_left','side_card_right','full_width','dual_banner']),
  bgColor:      z.string().max(20).optional(),
  displayOrder: z.number().int().min(0).optional(),
  startDate:    z.string().datetime().optional(),
  endDate:      z.string().datetime().optional(),
  isActive:     z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const banners = await prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { displayOrder: 'asc' }] })
    return ok(banners)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = bannerSchema.parse(await req.json())
    const data: any = { ...body }
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate)   data.endDate   = new Date(body.endDate)
    const banner = await prisma.banner.create({ data })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'banner_create', entityType: 'banner', entityId: banner.id },
    })
    return created(banner)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.object({ id: z.string(), ...bannerSchema.shape }).parse(await req.json())
    const { id, ...rest } = body
    const data: any = { ...rest }
    if (rest.startDate) data.startDate = new Date(rest.startDate)
    if (rest.endDate)   data.endDate   = new Date(rest.endDate)
    const banner = await prisma.banner.update({ where: { id }, data })
    return ok(banner)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const { id } = z.object({ id: z.string() }).parse(await req.json())
    await prisma.banner.delete({ where: { id } })
    return ok({ message: 'Banner deleted.' })
  } catch (err) { return handleError(err) }
}
