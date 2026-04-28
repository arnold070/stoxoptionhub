import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'My Account – Ecove Marketplace',
  description: 'Manage your orders, profile and account settings.',
  robots: 'noindex',
}
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
