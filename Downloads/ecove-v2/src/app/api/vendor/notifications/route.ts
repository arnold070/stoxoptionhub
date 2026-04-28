import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const notifications = await prisma.vendorNotification.findMany({
      where:   { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
    const unread = await prisma.vendorNotification.count({ where: { vendorId: vendor.id, isRead: false } })
    return ok({ notifications, unread })
  } catch (err) { return handleError(err) }
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const auth   = await requireAuth(req, ['vendor'])
    const vendor = await prisma.vendor.findUnique({ where: { userId: auth.sub }, select: { id: true } })
    if (!vendor) return apiError('Vendor not found', 404)

    const { ids } = z.object({ ids: z.array(z.string()).optional() }).parse(await req.json())

    if (ids?.length) {
      await prisma.vendorNotification.updateMany({ where: { id: { in: ids }, vendorId: vendor.id }, data: { isRead: true } })
    } else {
      await prisma.vendorNotification.updateMany({ where: { vendorId: vendor.id }, data: { isRead: true } })
    }
    return ok({ message: 'Marked as read.' })
  } catch (err) { return handleError(err) }
}
