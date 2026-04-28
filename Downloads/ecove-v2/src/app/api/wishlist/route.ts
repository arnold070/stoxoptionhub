import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, created, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const items = await prisma.wishlistItem.findMany({
      where: { userId: auth.sub },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true, comparePrice: true, stock: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            vendor: { select: { businessName: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return ok(items)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const { productId } = z.object({ productId: z.string() }).parse(await req.json())

    // Toggle: if exists remove, else add
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: auth.sub, productId } },
    })

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } })
      return ok({ action: 'removed', productId })
    }

    const item = await prisma.wishlistItem.create({
      data: { userId: auth.sub, productId },
    })
    return created({ action: 'added', item })
  } catch (err) { return handleError(err) }
}
