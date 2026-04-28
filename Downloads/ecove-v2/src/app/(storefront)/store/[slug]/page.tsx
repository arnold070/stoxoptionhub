import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import VendorStoreClient from './VendorStoreClient'

// Force dynamic rendering — vendor store data changes frequently
export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

async function getData(slug: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/storefront/vendors/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const d = await res.json()
    return d.data
  } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Store Not Found' }
  return {
    title: `${data.vendor.businessName} – Ecove Marketplace`,
    description: data.vendor.description?.slice(0, 160) || `Shop from ${data.vendor.businessName} on Ecove`,
  }
}

export default async function StorePage({ params }: Props) {
  const data = await getData(params.slug)
  if (!data) notFound()
  return <VendorStoreClient data={data} />
}
