import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Search Products – Ecove Marketplace',
  description: 'Search products from verified Nigerian sellers. Electronics, fashion, home goods, beauty and more.',
}
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
