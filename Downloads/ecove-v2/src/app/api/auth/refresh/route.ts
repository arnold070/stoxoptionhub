import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth'
import { apiError } from '@/lib/api'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('ecove_token')?.value
    if (!token) return apiError('No session found', 401)

    // Verify the existing token (allow slightly expired for refresh)
    let payload: any
    try {
      payload = verifyToken(token)
    } catch (err: any) {
      // Allow refresh within 1 day of expiry
      if (err?.name !== 'TokenExpiredError') return apiError('Invalid token', 401)
      const { verify } = await import('jsonwebtoken')
      payload = verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, role: true, email: true, isActive: true,
        vendor: { select: { id: true, status: true } },
      },
    })

    if (!user || !user.isActive) return apiError('Account not found or deactivated', 401)
    if (user.role === 'vendor' && user.vendor?.status !== 'approved') {
      return apiError('Vendor account is not active', 403)
    }

    const newToken = signToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      vendorId: user.vendor?.id,
    })

    const res = NextResponse.json({ success: true, data: { token: newToken } })
    res.cookies.set('ecove_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return res
  } catch {
    return apiError('Session refresh failed', 401)
  }
}
