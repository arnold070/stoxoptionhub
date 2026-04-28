import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Sign In – Ecove Marketplace',
  description: 'Sign in to your Ecove account to shop, track orders and manage your account.',
}
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
