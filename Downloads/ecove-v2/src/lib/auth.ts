import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import prisma from './prisma'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  sub: string        // userId
  role: Role
  vendorId?: string
  email: string
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function extractToken(req: NextRequest): string | null {
  // 1. Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  // 2. Cookie
  const cookie = req.cookies.get('ecove_token')
  if (cookie) return cookie.value
  return null
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = extractToken(req)
    if (!token) return null
    const payload = verifyToken(token)
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, role: true }
    })
    if (!user || !user.isActive) return null
    return payload
  } catch {
    return null
  }
}

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<JWTPayload> {
  const user = await getAuthUser(req)
  if (!user) throw new AuthError('Unauthorized', 401)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError('Forbidden', 403)
  }
  return user
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
