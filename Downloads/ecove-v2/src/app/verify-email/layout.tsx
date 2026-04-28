import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Verify Email – Ecove',
  description: "Verify your Ecove account email address.",
  robots: 'noindex',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
