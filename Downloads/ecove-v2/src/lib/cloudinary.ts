import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

export interface UploadResult {
  url:      string
  publicId: string
  width:    number
  height:   number
  format:   string
  bytes:    number
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string,
  options?: Record<string, unknown>
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ecove/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 5 * 1024 * 1024, // 5 MB
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Upload failed'))
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width,
          height:   result.height,
          format:   result.format,
          bytes:    result.bytes,
        })
      }
    )
    stream.end(fileBuffer)
  })
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}
