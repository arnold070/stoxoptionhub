import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'

// Force dynamic rendering — product data (stock, price) changes frequently
export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

async function getProduct(slug: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/storefront/products/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.data as { product: any; related: any[] }
  } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getProduct(params.slug)
  if (!result) return { title: 'Product Not Found' }
  const { product } = result
  return {
    title: `${product.name} – Ecove Marketplace`,
    description: product.shortDescription || product.description?.slice(0, 160),
    openGraph: { images: product.images?.[0]?.url ? [product.images[0].url] : [] },
  }
}

export default async function ProductPage({ params }: Props) {
  const result = await getProduct(params.slug)
  if (!result) notFound()
  const { product } = result

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ecove.com.ng'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || '',
    image: product.images?.map((i: any) => i.url) || [],
    sku: product.sku || product.id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'NGN',
      price: parseFloat(product.price),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: product.vendor?.businessName },
    },
    aggregateRating: product._count?.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(product.vendor?.averageRating || '0').toFixed(1),
      reviewCount: product._count.reviews,
    } : undefined,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={result.product} related={result.related} />
    </>
  )
}
