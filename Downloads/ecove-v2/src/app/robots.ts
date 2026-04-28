import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecove.com.ng'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/vendor/dashboard', '/api/', '/account', '/checkout', '/cart', '/orders'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
