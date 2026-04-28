/**
 * Rate limiter with Redis backend (falls back to in-memory if Redis unavailable).
 * In-memory works per-process. For multi-process production, REDIS_URL must be set.
 */

// ── In-memory fallback ───────────────────────────────────────────────────────
const memStore = new Map<string, { count: number; reset: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of memStore.entries()) {
    if (now > val.reset) memStore.delete(key)
  }
}, 10 * 60 * 1000)

function memRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now > entry.reset) {
    memStore.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// ── Redis backend ────────────────────────────────────────────────────────────
let redis: any = null

async function getRedis() {
  if (!process.env.REDIS_URL) return null
  if (redis) return redis
  try {
    const { default: IORedis } = await import('ioredis')
    redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    })
    await redis.connect()
    redis.on('error', () => { redis = null }) // reset on error so fallback kicks in
    return redis
  } catch {
    redis = null
    return null
  }
}

async function redisRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const client = await getRedis()
  if (!client) return memRateLimit(key, max, windowMs)

  try {
    const redisKey = `rl:${key}`
    const current = await client.incr(redisKey)
    if (current === 1) {
      await client.pexpire(redisKey, windowMs)
    }
    return current <= max
  } catch {
    return memRateLimit(key, max, windowMs)
  }
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * Async — awaits Redis when available, falls back to in-memory.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  return redisRateLimit(key, max, windowMs)
}
