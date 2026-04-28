import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, apiError, handleError, getPagination } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return apiError('Unauthorized', 401)

    const sp = req.nextUrl.searchParams
    const { page, limit, skip } = getPagination(sp)

    const orders = await prisma.order.findMany({
      where: { userId: auth.sub },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            id: true, productName: true, productImage: true,
            quantity: true, totalPrice: true, fulfillmentStatus: true,
            trackingNumber: true, vendorName: true,
          },
        },
      },
    })

    return ok(orders)
  } catch (err) { return handleError(err) }
}
