import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
  }

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    checks.database = { status: 'error', error: 'Database unreachable' }
    checks.status = 'degraded'
  }

  // Redis check (optional)
  if (process.env.REDIS_URL) {
    const redisStart = Date.now()
    try {
      const { default: IORedis } = await import('ioredis')
      const redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true })
      await redis.connect()
      await redis.ping()
      await redis.disconnect()
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
    } catch {
      checks.redis = { status: 'unavailable' }
    }
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
