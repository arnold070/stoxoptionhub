import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'

const schema = z.object({ token: z.string().min(32) })

export async function POST(req: NextRequest) {
  try {
    const { token } = schema.parse(await req.json())
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpiry: { gt: new Date() } },
    })
    if (!user) return apiError('Invalid or expired verification link.', 400)
    await prisma.user.update({
      where: { id: user.id },
      data:  { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    })
    return ok({ message: 'Email verified successfully.' })
  } catch (err) {
    return handleError(err)
  }
}
