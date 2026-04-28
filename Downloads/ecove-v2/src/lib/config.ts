/**
 * src/lib/config.ts
 *
 * Runtime configuration loader.
 *
 * Priority order for every setting:
 *   1. Database (site_settings table) — set via Admin → Settings
 *   2. Environment variable (.env.local) — set at deploy time
 *   3. Hardcoded default
 *
 * This means admins can override any key from the dashboard without
 * needing to SSH into the server and restart the app.
 *
 * Sensitive values (API keys, passwords) stored in the database are
 * encrypted at rest using AES-256-GCM. The encryption key itself is
 * the only thing that must live in .env.local (CONFIG_ENCRYPTION_KEY).
 *
 * HOW ENCRYPTION WORKS:
 *   - Values stored with the  enc:  prefix are encrypted.
 *   - Plain values (legacy or non-sensitive) are stored as-is.
 *   - Encryption key: CONFIG_ENCRYPTION_KEY in .env.local
 *     Generate with:  openssl rand -hex 32
 */

import prisma from './prisma'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ── Encryption helpers ────────────────────────────────────────────────────────
const ALG = 'aes-256-gcm'

function getEncryptionKey(): Buffer | null {
  const k = process.env.CONFIG_ENCRYPTION_KEY
  if (!k || k.length < 32) return null
  return Buffer.from(k.slice(0, 64), 'hex')  // 32 bytes from hex string
}

export function encryptValue(plaintext: string): string {
  const key = getEncryptionKey()
  if (!key) return plaintext  // no key configured — store plain

  const iv         = randomBytes(12)               // 96-bit IV for GCM
  const cipher     = createCipheriv(ALG, key, iv)
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag    = cipher.getAuthTag()

  // Format: enc:<iv_hex>:<authtag_hex>:<ciphertext_hex>
  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptValue(stored: string): string {
  if (!stored.startsWith('enc:')) return stored  // not encrypted

  const key = getEncryptionKey()
  if (!key) {
    console.error('[config] Encrypted value found but CONFIG_ENCRYPTION_KEY is not set')
    return ''
  }

  try {
    const [, ivHex, tagHex, dataHex] = stored.split(':')
    const iv       = Buffer.from(ivHex, 'hex')
    const authTag  = Buffer.from(tagHex, 'hex')
    const data     = Buffer.from(dataHex, 'hex')
    const decipher = createDecipheriv(ALG, key, iv)
    decipher.setAuthTag(authTag)
    return decipher.update(data).toString('utf8') + decipher.final('utf8')
  } catch {
    console.error('[config] Failed to decrypt config value')
    return ''
  }
}

// ── Config cache (per-request, avoid N+1 DB calls) ───────────────────────────
// We cache for 60 seconds so changes take effect quickly without hammering the DB
let _cache:     Record<string, string> | null = null
let _cacheTime  = 0
const TTL_MS    = 60_000  // 60 seconds

async function loadAllSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  if (_cache && now - _cacheTime < TTL_MS) return _cache

  try {
    const rows = await prisma.siteSetting.findMany()
    const map: Record<string, string> = {}
    for (const row of rows) {
      map[row.key] = decryptValue(row.value)
    }
    _cache     = map
    _cacheTime = now
    return map
  } catch {
    // DB unavailable — fall through to env vars
    return _cache || {}
  }
}

// Force cache refresh (call after saving settings)
export function invalidateConfigCache() {
  _cache     = null
  _cacheTime = 0
}

// ── Main config getter ────────────────────────────────────────────────────────
/**
 * Get a single config value.
 * @param dbKey   Key in the site_settings table (e.g. 'payment.paystack.secret_key')
 * @param envKey  Fallback environment variable name (e.g. 'PAYSTACK_SECRET_KEY')
 * @param fallback Default value if neither DB nor env has it
 */
export async function getConfig(
  dbKey: string,
  envKey?: string,
  fallback = ''
): Promise<string> {
  const settings = await loadAllSettings()
  if (settings[dbKey]) return settings[dbKey]
  if (envKey && process.env[envKey]) return process.env[envKey]!
  return fallback
}

// ── Typed config getters ──────────────────────────────────────────────────────
export async function getPaystackConfig() {
  const [secretKey, publicKey, webhookSecret] = await Promise.all([
    getConfig('payment.paystack.secret_key',   'PAYSTACK_SECRET_KEY'),
    getConfig('payment.paystack.public_key',   'PAYSTACK_PUBLIC_KEY'),
    getConfig('payment.paystack.webhook_secret','PAYSTACK_WEBHOOK_SECRET'),
  ])
  return { secretKey, publicKey, webhookSecret }
}

export async function getFlutterwaveConfig() {
  const [secretKey, webhookSecret, publicKey] = await Promise.all([
    getConfig('payment.flutterwave.secret_key',   'FLUTTERWAVE_SECRET_KEY'),
    getConfig('payment.flutterwave.webhook_secret','FLUTTERWAVE_WEBHOOK_SECRET'),
    getConfig('payment.flutterwave.public_key',   'FLUTTERWAVE_PUBLIC_KEY'),
  ])
  return { secretKey, webhookSecret, publicKey }
}

export async function getSmtpConfig() {
  const [host, port, secure, user, pass, from] = await Promise.all([
    getConfig('email.smtp.host',   'SMTP_HOST'),
    getConfig('email.smtp.port',   'SMTP_PORT',   '465'),
    getConfig('email.smtp.secure', 'SMTP_SECURE', 'true'),
    getConfig('email.smtp.user',   'SMTP_USER'),
    getConfig('email.smtp.pass',   'SMTP_PASS'),
    getConfig('email.from',        'EMAIL_FROM',  'Ecove Marketplace <noreply@ecove.com.ng>'),
  ])
  return { host, port: Number(port), secure: secure === 'true', user, pass, from }
}

export async function getBankConfig() {
  const [name, accountNumber, accountName] = await Promise.all([
    getConfig('bank.name',           'COMPANY_BANK_NAME'),
    getConfig('bank.account_number', 'COMPANY_ACCOUNT_NUMBER'),
    getConfig('bank.account_name',   'COMPANY_ACCOUNT_NAME'),
  ])
  return { name, accountNumber, accountName }
}
