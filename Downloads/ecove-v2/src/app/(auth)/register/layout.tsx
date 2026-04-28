import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Create Account – Ecove Marketplace',
  description: 'Join Ecove Marketplace. Shop electronics, fashion, home goods and more in Nigeria.',
}
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
