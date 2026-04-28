import { NextRequest } from 'next/server'
import logger from '@/lib/logger'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'
import { sendVerifyEmail } from '@/lib/email'
import { generateToken } from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName:  z.string().min(2).max(50),
  email:     z.string().email(),
  password:  z.string().min(8).max(100),
  phone:     z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!await rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
      return apiError('Too many registration attempts. Try again in 15 minutes.', 429)
    }

    const body = schema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return apiError('An account with this email already exists.', 409)

    const passwordHash = await bcrypt.hash(body.password, 12)
    const verifyToken  = generateToken()
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        firstName:        body.firstName,
        lastName:         body.lastName,
        email:            body.email,
        phone:            body.phone,
        passwordHash,
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyExpiry,
      },
      select: { id: true, firstName: true, email: true },
    })

    await sendVerifyEmail(user.email, user.firstName, verifyToken).catch(() => {})

    return ok({ message: 'Account created. Please check your email to verify your account.' }, 201)
  } catch (err) {
    return handleError(err)
  }
}
