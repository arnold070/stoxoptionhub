import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'
import { generateToken } from '@/lib/utils'
import { sendVerifyEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!await rateLimit(`resend-verify:${ip}`, 3, 10 * 60 * 1000)) {
      return apiError('Too many requests. Please wait 10 minutes.', 429)
    }
    const auth = await requireAuth(req)
    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { id: true, email: true, firstName: true, isEmailVerified: true },
    })
    if (!user) return apiError('User not found', 404)
    if (user.isEmailVerified) return ok({ message: 'Email already verified.' })

    const token  = generateToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
    })
    await sendVerifyEmail(user.email, user.firstName, token)
    return ok({ message: 'Verification email sent. Please check your inbox.' })
  } catch (err) { return handleError(err) }
}
