import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'My Orders – Ecove Marketplace',
  description: 'Track and manage your orders.',
  robots: 'noindex',
}
export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
