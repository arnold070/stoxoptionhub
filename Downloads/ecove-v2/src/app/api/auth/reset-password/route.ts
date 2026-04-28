import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'

const schema = z.object({
  token:    z.string().min(32),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    })
    if (!user) return apiError('Invalid or expired reset link.', 400)
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetToken: null, resetTokenExpiry: null },
    })
    return ok({ message: 'Password updated successfully. You can now log in.' })
  } catch (err) {
    return handleError(err)
  }
}
