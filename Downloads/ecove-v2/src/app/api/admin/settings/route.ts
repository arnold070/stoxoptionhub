import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'
import { encryptValue, decryptValue, invalidateConfigCache } from '@/lib/config'

// Keys that contain sensitive data and must be encrypted at rest
const SENSITIVE_KEYS = new Set([
  'payment.paystack.secret_key',
  'payment.paystack.webhook_secret',
  'payment.flutterwave.secret_key',
  'payment.flutterwave.webhook_secret',
  'email.smtp.pass',
])

// Keys that should be masked when returned to the frontend
// so the actual secret is never sent over the wire after saving
const MASKED_KEYS = new Set([
  'payment.paystack.secret_key',
  'payment.paystack.webhook_secret',
  'payment.flutterwave.secret_key',
  'payment.flutterwave.webhook_secret',
  'email.smtp.pass',
  'bank.account_number',
])

const MASK = '••••••••••••••••'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const settings = await prisma.siteSetting.findMany()

    const map: Record<string, string> = {}
    for (const s of settings) {
      const plain = decryptValue(s.value)
      // Mask sensitive values — frontend only shows whether they're set, not the value
      map[s.key] = MASKED_KEYS.has(s.key) && plain ? MASK : plain
    }
    return ok(map)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['admin', 'super_admin'])
    const body = z.record(z.string()).parse(await req.json())

    const ops = Object.entries(body)
      // Skip masked placeholder values — admin left them unchanged
      .filter(([, value]) => value !== MASK)
      .map(([key, value]) => {
        const stored = SENSITIVE_KEYS.has(key) ? encryptValue(value) : value
        return prisma.siteSetting.upsert({
          where:  { key },
          update: { value: stored },
          create: { key, value: stored },
        })
      })

    if (ops.length > 0) {
      await prisma.$transaction(ops)
    }

    // Flush the in-memory config cache so changes apply to next request
    invalidateConfigCache()

    // Audit log — omit actual values for sensitive keys
    const auditMeta = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) ? '[redacted]' : v])
    )
    await prisma.auditLog.create({
      data: {
        actorId:    auth.sub,
        actorRole:  auth.role,
        action:     'settings_update',
        entityType: 'site_settings',
        entityId:   'global',
        meta:       auditMeta,
      },
    })

    return ok({ message: 'Settings saved.' })
  } catch (err) { return handleError(err) }
}

// POST /api/admin/settings/test-email — send a test email using current SMTP config
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['admin', 'super_admin'])
    const { action, to } = z.object({
      action: z.literal('test_email'),
      to:     z.string().email(),
    }).parse(await req.json())

    const { sendTestEmail } = await import('@/lib/email')
    const ok_result = await sendTestEmail(to)

    return ok({
      success: ok_result,
      message: ok_result
        ? `Test email sent to ${to}. Check your inbox.`
        : 'Failed to send test email. Check your SMTP settings.',
    })
  } catch (err) { return handleError(err) }
}
