import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { apiError, handleError } from '@/lib/api'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return apiError('Too many login attempts. Try again in 15 minutes.', 429)
    }

    const { email, password } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: {
          select: {
            id: true, businessName: true, slug: true, status: true,
            logoUrl: true, availableBalance: true, pendingBalance: true,
            averageRating: true, totalOrders: true,
          }
        }
      },
    })

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return apiError('Invalid email or password.', 401)
    }
    if (!user.isActive) return apiError('Your account has been deactivated.', 403)

    // Vendor status check
    if (user.role === 'vendor') {
      if (user.vendor?.status === 'pending') {
        return apiError('Your vendor application is under review. You will be notified once approved.', 403)
      }
      if (user.vendor?.status === 'rejected') {
        return apiError('Your vendor application was not approved. Contact support@ecove.com.ng', 403)
      }
      if (user.vendor?.status === 'suspended') {
        return apiError('Your vendor account has been suspended. Contact support@ecove.com.ng', 403)
      }
    }

    const token = signToken({
      sub:      user.id,
      role:     user.role,
      email:    user.email,
      vendorId: user.vendor?.id,
    })

    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    })

    const res = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id:        user.id,
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          role:      user.role,
          vendor:    user.vendor,
        },
      },
    })

    // Set HTTP-only cookie
    res.cookies.set('ecove_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60, // 7 days
      path:     '/',
    })

    return res
  } catch (err) {
    return handleError(err)
  }
}
