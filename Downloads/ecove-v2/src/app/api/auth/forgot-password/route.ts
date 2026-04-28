import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'
import { sendPasswordReset } from '@/lib/email'
import { generateToken } from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimit'

const forgotSchema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!await rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000)) {
      return apiError('Too many requests.', 429)
    }
    const { email } = forgotSchema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { email } })
    // Always return ok (prevent email enumeration)
    if (user) {
      const token  = generateToken()
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data:  { resetToken: token, resetTokenExpiry: expiry },
      })
      await sendPasswordReset(email, user.firstName, token).catch(() => {})
    }
    return ok({ message: 'If an account exists for that email, a reset link has been sent.' })
  } catch (err) {
    return handleError(err)
  }
}
