import prisma from './prisma'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uniqueSlug(
  base: string,
  model: 'product' | 'vendor' | 'category'
): Promise<string> {
  const slug = slugify(base)
  let candidate = slug
  let i = 1
  while (true) {
    const exists = await (prisma[model] as any).findUnique({ where: { slug: candidate } })
    if (!exists) return candidate
    candidate = `${slug}-${i++}`
  }
}

export function generateOrderNumber(): string {
  const date = new Date()
  const yy   = date.getFullYear().toString().slice(-2)
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  const arr = typeof crypto !== 'undefined'
    ? crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000
    : Math.floor(Math.random() * 900000 + 100000)
  return `ECO-${yy}${mm}${dd}-${arr}`
}

export function generateToken(bytes = 32): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}
