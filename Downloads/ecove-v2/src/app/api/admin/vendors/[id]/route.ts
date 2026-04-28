import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'
import {
  sendVendorApproved,
  sendVendorRejected,
  sendVendorSuspended,
} from '@/lib/email'

const patchSchema = z.object({
  action:      z.enum(['approve', 'reject', 'suspend', 'activate']),
  statusNote:  z.string().max(500).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
})

const editSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  description:  z.string().max(1000).optional(),
  tagline:      z.string().max(200).optional(),
  phone:        z.string().optional(),
  whatsapp:     z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().optional(),
  address:      z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  maxProducts:  z.number().min(1).max(10000).optional(),
  isAutoApproved: z.boolean().optional(),
})

// GET /api/admin/vendors/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
        products: { select: { id: true, name: true, status: true, price: true }, take: 10, orderBy: { createdAt: 'desc' } },
        payouts:  { select: { id: true, amount: true, status: true, requestedAt: true }, take: 5, orderBy: { requestedAt: 'desc' } },
        _count:   { select: { products: true, orderItems: true, payouts: true, vendorReviews: true } },
      },
    })
    if (!vendor) return apiError('Vendor not found', 404)
    return ok(vendor)
  } catch (err) { return handleError(err) }
}

// PATCH /api/admin/vendors/[id]  — approve | reject | suspend | activate
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = patchSchema.parse(await req.json())

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, firstName: true } } },
    })
    if (!vendor) return apiError('Vendor not found', 404)

    const statusMap: Record<string, string> = {
      approve: 'approved', reject: 'rejected',
      suspend: 'suspended', activate: 'approved',
    }

    const updated = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        status:        statusMap[body.action] as any,
        statusNote:    body.statusNote,
        commissionRate: body.commissionRate,
        ...(body.action === 'approve' && { approvedAt: new Date(), approvedById: auth.sub }),
        // If approved, set vendor role on user
      },
    })

    // Update user role when vendor is approved
    if (body.action === 'approve') {
      await prisma.user.update({ where: { id: vendor.userId }, data: { role: 'vendor' } })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.sub, actorRole: auth.role,
        action: `vendor_${body.action}`, entityType: 'vendor', entityId: params.id,
        meta: { note: body.statusNote },
      },
    })

    // Send email
    const email = vendor.user.email
    const name  = vendor.businessName
    if (body.action === 'approve')  await sendVendorApproved(email, name).catch(() => {})
    if (body.action === 'reject')   await sendVendorRejected(email, name, body.statusNote || 'Does not meet requirements').catch(() => {})
    if (body.action === 'suspend')  await sendVendorSuspended(email, name, body.statusNote || 'Policy violation').catch(() => {})

    return ok(updated)
  } catch (err) { return handleError(err) }
}

// PUT /api/admin/vendors/[id]  — edit vendor info
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = editSchema.parse(await req.json())
    const updated = await prisma.vendor.update({ where: { id: params.id }, data: body })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'vendor_edit', entityType: 'vendor', entityId: params.id, meta: body },
    })
    return ok(updated)
  } catch (err) { return handleError(err) }
}

// DELETE /api/admin/vendors/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req, ['super_admin'])
    await prisma.vendor.delete({ where: { id: params.id } })
    await prisma.auditLog.create({
      data: { actorId: auth.sub, actorRole: auth.role, action: 'vendor_delete', entityType: 'vendor', entityId: params.id },
    })
    return ok({ message: 'Vendor deleted.' })
  } catch (err) { return handleError(err) }
}
