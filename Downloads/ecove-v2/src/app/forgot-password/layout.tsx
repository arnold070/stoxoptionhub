import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Reset Password – Ecove',
  description: "Reset your Ecove account password.",
  robots: 'noindex',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
