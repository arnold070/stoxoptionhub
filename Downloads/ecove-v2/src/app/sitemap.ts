import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecove.com.ng'
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/vendor/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    // Categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
      url: `${baseUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Products (approved, active)
    const products = await prisma.product.findMany({
      where: { status: 'approved', isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000, // sitemap limit
    })
    const productPages: MetadataRoute.Sitemap = products.map(p => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Vendor stores
    const vendors = await prisma.vendor.findMany({
      where: { status: 'approved' },
      select: { slug: true, updatedAt: true },
    })
    const vendorPages: MetadataRoute.Sitemap = vendors.map(v => ({
      url: `${baseUrl}/store/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...categoryPages, ...productPages, ...vendorPages]
  } catch {
    return staticPages
  }
}
