import { NextRequest } from 'next/server'
import logger from '@/lib/logger'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getPaystackConfig } from '@/lib/config'
import { created, apiError, handleError } from '@/lib/api'
import { calcCommission } from '@/lib/commission'
import { generateOrderNumber } from '@/lib/utils'
import { Decimal } from '@prisma/client/runtime/library'

// Maximum execution time (seconds) — important for Vercel Pro users
export const maxDuration = 60

const addressSchema = z.object({
  firstName:    z.string().min(1),
  lastName:     z.string().min(1),
  phone:        z.string().min(7),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city:         z.string().min(2),
  state:        z.string().min(2),
  country:      z.string().default('Nigeria'),
})

const itemSchema = z.object({
  productId: z.string(),
  quantity:  z.number().int().positive(),
  variantId: z.string().optional(),
})

const schema = z.object({
  items:           z.array(itemSchema).min(1),
  shippingAddress: addressSchema,
  couponCode:      z.string().optional(),
  notes:           z.string().max(500).optional(),
  guestEmail:      z.string().email().optional(),
  guestPhone:      z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req) // nullable — guest checkout supported
    const body = schema.parse(await req.json())
    // Rate limit: 10 checkout attempts per IP per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (!await rateLimit(`checkout:${ip}`, 10, 60 * 60 * 1000)) {
      return apiError('Too many checkout attempts. Please wait before trying again.', 429)
    }


    if (!auth && !body.guestEmail) {
      return apiError('Please provide an email address for your order.', 400)
    }

    // Require email verification for logged-in users
    if (auth) {
      const user = await prisma.user.findUnique({
        where: { id: auth.sub },
        select: { isEmailVerified: true, email: true },
      })
      if (user && !user.isEmailVerified) {
        return apiError('Please verify your email address before placing an order. Check your inbox for a verification link.', 403)
      }
    }

    // Require email verification for logged-in users
    if (auth) {
      const user = await prisma.user.findUnique({
        where: { id: auth.sub },
        select: { isEmailVerified: true },
      })
      if (user && !user.isEmailVerified) {
        return apiError('Please verify your email address before placing an order. Check your inbox for the verification link.', 403)
      }
    }

    // Require email verification for logged-in users
    if (auth) {
      const authUser = await prisma.user.findUnique({
        where: { id: auth.sub },
        select: { isEmailVerified: true },
      })
      if (authUser && !authUser.isEmailVerified) {
        return apiError(
          'Please verify your email address before placing an order. Check your inbox for a verification link.',
          403
        )
      }
    }

    // ── 1. Validate all products and compute totals ──────────
    const productIds = body.items.map(i => i.productId)
    const products   = await prisma.product.findMany({
      where:   { id: { in: productIds }, status: 'approved', isActive: true },
      include: { vendor: true, category: { select: { id: true } } },
    })

    if (products.length !== productIds.length) {
      return apiError('One or more products are unavailable.', 400)
    }

    // Stock check
    for (const item of body.items) {
      const product = products.find(p => p.id === item.productId)!
      if (product.stock < item.quantity) {
        return apiError(`"${product.name}" only has ${product.stock} unit(s) in stock.`, 400)
      }
    }

    // ── 2. Apply coupon if provided ──────────────────────────
    let couponDiscount = new Decimal(0)
    let coupon = null
    if (body.couponCode) {
      const now = new Date()
      coupon = await prisma.coupon.findFirst({
        where: {
          code:     body.couponCode.toUpperCase(),
          isActive: true,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gt: now } }] }],
        },
      })
      if (!coupon) return apiError('Invalid or expired coupon code.', 400)
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return apiError('This coupon has reached its usage limit.', 400)
      }
      // Compute discount (simplified — percentage only for now)
      if (coupon.type === 'percentage' && coupon.value) {
        // Applied after subtotal calculation below
      }
    }

    // ── 3. Build order items with commissions ────────────────
    // Fetch primary images for all products in one query
    const productImages = await prisma.productImage.findMany({
      where: { productId: { in: productIds }, isPrimary: true },
      select: { productId: true, url: true },
    })
    const imageMap = new Map(productImages.map(i => [i.productId, i.url]))

    // Batch-fetch all commission rules to avoid N+1 queries in the loop
    const categoryIds = products.map(p => p.category?.id).filter(Boolean) as string[]
    const vendorIds   = [...new Set(products.map(p => p.vendorId))]
    const [allCommRules, vendorsWithRates] = await Promise.all([
      prisma.commissionRule.findMany({
        where: {
          isActive: true,
          OR: [
            { type: 'global' },
            { type: 'category', categoryId: { in: categoryIds } },
            { type: 'vendor',   vendorId:   { in: vendorIds } },
          ],
        },
      }),
      prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, commissionRate: true },
      }),
    ])
    const vendorRateMap = new Map(vendorsWithRates.map(v => [v.id, v.commissionRate]))

    const resolveRate = (vendorId: string, categoryId?: string | null): Decimal => {
      // 1. Vendor rule
      const vRule = allCommRules.find(r => r.type === 'vendor' && r.vendorId === vendorId)
      if (vRule) return vRule.rate
      // 2. Vendor direct rate
      const vRate = vendorRateMap.get(vendorId)
      if (vRate) return vRate
      // 3. Category rule
      if (categoryId) {
        const cRule = allCommRules.find(r => r.type === 'category' && r.categoryId === categoryId)
        if (cRule) return cRule.rate
      }
      // 4. Global rule
      const gRule = allCommRules.find(r => r.type === 'global')
      if (gRule) return gRule.rate
      // 5. Default
      return new Decimal(10)
    }

    // Batch-fetch all variants upfront to avoid N+1
    const variantIds = body.items.map(i => i.variantId).filter(Boolean) as string[]
    const variantsAll = variantIds.length > 0
      ? await prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
      : []
    const variantMap = new Map(variantsAll.map(v => [v.id, v]))

    let subtotal = new Decimal(0)
    const orderItemsData: any[] = []

    for (const item of body.items) {
      const product    = products.find(p => p.id === item.productId)!
      const unitPrice  = product.isFlashSale && product.flashSalePrice
        ? product.flashSalePrice
        : product.price
      const totalPrice = unitPrice.mul(item.quantity)
      subtotal = subtotal.add(totalPrice)

      const commRate   = resolveRate(product.vendorId, product.category?.id)
      const { commissionAmt, vendorEarning } = calcCommission(totalPrice, commRate)

      // Get variant info from pre-fetched map
      const variantData = item.variantId && variantMap.has(item.variantId)
        ? { name: variantMap.get(item.variantId)!.name, value: variantMap.get(item.variantId)!.value }
        : null

      orderItemsData.push({
        productId:    product.id,
        vendorId:     product.vendorId,
        productName:  product.name,
        vendorName:   product.vendor.businessName,
        productImage: imageMap.get(product.id) || null,
        quantity:     item.quantity,
        unitPrice,
        totalPrice,
        variant:      variantData,
        commissionRate: commRate,
        commissionAmt,
        vendorEarning,
      })
    }

    // Coupon discount
    if (coupon?.type === 'percentage' && coupon.value) {
      couponDiscount = subtotal.mul(coupon.value).div(100).toDecimalPlaces(2)
    } else if (coupon?.type === 'fixed' && coupon.value) {
      couponDiscount = coupon.value
    }

    // Shipping fee: free over ₦20,000 (after discounts), else ₦1,500
    // Also free if a free_shipping coupon is applied
    const afterDiscount = subtotal.minus(couponDiscount)
    const hasFreeShippingCoupon = coupon?.type === 'free_shipping'
    const shippingFee = (afterDiscount.gte(20000) || hasFreeShippingCoupon)
      ? new Decimal(0)
      : new Decimal(1500)
    const total       = subtotal.minus(couponDiscount).add(shippingFee).toDecimalPlaces(2)

    // ── 4. Create order in transaction ──────────────────────
    const orderNumber = generateOrderNumber()
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          userId:          auth?.sub ?? null,
          guestEmail:      body.guestEmail,
          guestPhone:      body.guestPhone,
          subtotal,
          discount:        couponDiscount,
          shippingFee,
          total,
          couponCode:      coupon?.code,
          couponDiscount:  couponDiscount.gt(0) ? couponDiscount : null,
          shippingAddress: body.shippingAddress,
          notes:           body.notes,
          paymentStatus:   'unpaid',
          items: { create: orderItemsData },
        },
        include: { items: true },
      })

      // NOTE: Stock decremented & coupon usage incremented in Paystack webhook
      // after payment confirmation — not here — to avoid phantom locks on unpaid orders.

      return o
    })

    // ── 4b. Save shipping address to address book for logged-in users ─────
    if (auth?.sub) {
      const addr = body.shippingAddress
      // Check if identical address already exists to avoid duplicates
      const existing = await prisma.address.findFirst({
        where: {
          userId:      auth.sub,
          addressLine1: addr.addressLine1,
          city:         addr.city,
          state:        addr.state,
        },
      })
      if (!existing) {
        const count = await prisma.address.count({ where: { userId: auth.sub } })
        await prisma.address.create({
          data: {
            userId:       auth.sub,
            firstName:    addr.firstName,
            lastName:     addr.lastName,
            phone:        addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city:         addr.city,
            state:        addr.state,
            country:      addr.country || 'Nigeria',
            isDefault:    count === 0, // first address becomes default
          },
        }).catch(() => {}) // non-blocking, don't fail checkout if this errors
      }
    }

    // ── 5. Init Paystack payment ─────────────────────────────
    const customerEmail = auth
      ? (await prisma.user.findUnique({ where: { id: auth.sub }, select: { email: true } }))?.email
      : body.guestEmail

    const paystackCfg = await getPaystackConfig()
    if (!paystackCfg.secretKey) return apiError('Paystack is not configured. Add keys in Admin → Settings.', 503)

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${paystackCfg.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:      customerEmail,
        amount:     total.mul(100).toFixed(0), // Paystack uses kobo
        reference:  orderNumber,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirm?ref=${orderNumber}`,
        metadata: {
          orderId:     order.id,
          orderNumber: order.orderNumber,
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
          ],
        },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackData.status) {
      return apiError('Payment gateway error. Please try again.', 502)
    }

    // Save payment reference on order
    await prisma.order.update({
      where: { id: order.id },
      data:  { paymentRef: paystackData.data.reference },
    })

    // ── 6. Emails sent by webhook after payment confirmed ───
    // (Sending at checkout would email before payment is complete)

    return created({
      orderId:         order.id,
      orderNumber:     order.orderNumber,
      total:           total.toFixed(2),
      paymentUrl:      paystackData.data.authorization_url,
      paymentRef:      paystackData.data.reference,
    })
  } catch (err) { return handleError(err) }
}
