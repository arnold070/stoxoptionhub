import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ok, apiError, handleError } from '@/lib/api'
import { uploadImage, deleteImage } from '@/lib/cloudinary'
import { z } from 'zod'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (!await rateLimit(`upload:${ip}`, 30, 60 * 60 * 1000)) {
      return apiError('Upload rate limit exceeded. Try again later.', 429)
    }

    const auth = await requireAuth(req, ['vendor', 'admin', 'super_admin'])

    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const folder   = (formData.get('folder') as string) || 'general'

    if (!file) return apiError('No file provided.', 400)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('Only JPG, PNG, and WebP images are allowed.', 400)
    }
    if (file.size > MAX_SIZE_BYTES) {
      return apiError('File too large. Maximum size is 5MB.', 400)
    }

    // Restrict folder access by role
    const allowedFolders: Record<string, string[]> = {
      vendor:      ['products', 'vendor-logo', 'vendor-banner', 'id-docs'],
      admin:       ['products', 'banners', 'categories', 'vendor-logo', 'vendor-banner'],
      super_admin: ['products', 'banners', 'categories', 'vendor-logo', 'vendor-banner'],
    }

    if (!allowedFolders[auth.role]?.includes(folder)) {
      return apiError(`Upload to folder "${folder}" is not allowed.`, 403)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, folder)

    return ok({
      url:      result.url,
      publicId: result.publicId,
      width:    result.width,
      height:   result.height,
      bytes:    result.bytes,
    })
  } catch (err) { return handleError(err) }
}

// DELETE /api/upload  — remove image from Cloudinary
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ['vendor', 'admin', 'super_admin'])
    const { publicId } = z.object({ publicId: z.string().min(1) }).parse(await req.json())

    // Vendors can only delete their own images (publicId contains their vendorId folder)
    if (auth.role === 'vendor' && !publicId.includes(`ecove/products`) && !publicId.includes(`ecove/vendor`)) {
      return apiError('You can only delete your own images.', 403)
    }

    await deleteImage(publicId)
    return ok({ message: 'Image deleted.' })
  } catch (err) { return handleError(err) }
}
