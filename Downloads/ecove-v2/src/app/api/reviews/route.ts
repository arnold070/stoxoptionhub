import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, created, apiError, handleError, getPagination } from '@/lib/api'

const createSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(1000).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const productId = sp.get('productId')
    const vendorId = sp.get('vendorId')
    const { page, limit, skip } = getPagination(sp)

    if (!productId && !vendorId) return apiError('productId or vendorId required', 400)

    const reviews = await prisma.review.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(vendorId ? { vendorId } : {}),
        status: 'approved',
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    const total = await prisma.review.count({
      where: {
        ...(productId ? { productId } : {}),
        status: 'approved',
      },
    })

    return ok({ reviews, total })
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (!await rateLimit(`review:${ip}`, 5, 60 * 60 * 1000)) {
      return apiError('Too many review submissions. Please wait before trying again.', 429)
    }

    const auth = await getAuthUser(req)
    const body = createSchema.parse(await req.json())

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: body.productId, status: 'approved' },
      select: { id: true, vendorId: true },
    })
    if (!product) return apiError('Product not found', 404)

    // Check verified purchase if logged in
    let isVerifiedPurchase = false
    if (auth) {
      const purchase = await prisma.orderItem.findFirst({
        where: {
          productId: body.productId,
          order: { userId: auth.sub, paymentStatus: 'paid' },
        },
      })
      isVerifiedPurchase = !!purchase
    }

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        vendorId: product.vendorId,
        userId: auth?.sub ?? null,
        rating: body.rating,
        title: body.title,
        body: body.body,
        isVerifiedPurchase,
        status: 'pending', // admin moderation required
      },
    })

    return created({ message: 'Review submitted and awaiting approval.', id: review.id })
  } catch (err) { return handleError(err) }
}
