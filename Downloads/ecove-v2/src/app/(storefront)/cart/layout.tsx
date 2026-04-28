import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Shopping Cart – Ecove Marketplace',
  description: 'Review your items and proceed to secure checkout.',
  robots: 'noindex',
}
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
