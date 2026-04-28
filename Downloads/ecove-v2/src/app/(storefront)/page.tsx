import { Metadata } from 'next'
import HomepageClient from './HomepageClient'

// Force dynamic rendering — marketplace data changes frequently
// and self-referential fetches during build would hit an unavailable server
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Ecove – Nigeria's Online Marketplace | Shop Smart, Live Better",
  description: 'Shop electronics, fashion, home appliances, phones, beauty products and more at the best prices in Nigeria. Fast delivery nationwide.',
}

async function getData() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const [productsRes, categoriesRes, flashSaleRes, bannersRes, vendorsRes] = await Promise.all([
      fetch(`${base}/api/storefront/products?featured=true&limit=12`, { next: { revalidate: 300 } }),
      fetch(`${base}/api/storefront/categories?limit=12`,             { next: { revalidate: 600 } }),
      fetch(`${base}/api/storefront/products?flashSale=true&limit=8`, { next: { revalidate: 60  } }),
      fetch(`${base}/api/storefront/banners`,                         { next: { revalidate: 300 } }),
      fetch(`${base}/api/storefront/vendors?limit=1`,                 { next: { revalidate: 600 } }),
    ])
    const [featuredData, categoriesData, flashSaleData, bannersData, vendorsData] = await Promise.all([
      productsRes.ok   ? productsRes.json()   : { data: [] },
      categoriesRes.ok ? categoriesRes.json() : { data: [] },
      flashSaleRes.ok  ? flashSaleRes.json()  : { data: [] },
      bannersRes.ok    ? bannersRes.json()     : { data: [] },
      vendorsRes.ok    ? vendorsRes.json()     : { pagination: { total: 0 } },
    ])
    return {
      featured:    featuredData.data   || [],
      categories:  categoriesData.data || [],
      flashSale:   flashSaleData.data  || [],
      banners:     bannersData.data    || [],
      vendorCount: vendorsData.pagination?.total || 0,
    }
  } catch {
    return { featured: [], categories: [], flashSale: [], banners: [], vendorCount: 0 }
  }
}

export default async function HomePage() {
  const { featured, categories, flashSale, banners, vendorCount } = await getData()
  return (
    <HomepageClient
      featured={featured}
      categories={categories}
      flashSale={flashSale}
      banners={banners}
      vendorCount={vendorCount}
    />
  )
}
