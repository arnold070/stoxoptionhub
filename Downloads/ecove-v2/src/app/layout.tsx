import '@/lib/init' // Start background jobs
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/context/QueryProvider'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['700','800'] })

export const metadata: Metadata = {
  title: "Ecove – Nigeria's Online Marketplace | Shop Smart, Live Better",
  description: 'Shop electronics, fashion, home appliances, phones, beauty products and more at the best prices in Nigeria. Fast delivery nationwide.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ecove.com.ng'),
  openGraph: { type: 'website', locale: 'en_NG', url: 'https://ecove.com.ng', siteName: 'Ecove Marketplace' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="antialiased bg-gray-50 text-gray-900">
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" toastOptions={{ duration: 4000,
              style: { fontFamily: 'var(--font-sans)', fontSize: '14px' },
              success: { iconTheme: { primary: '#f68b1f', secondary: '#fff' } },
              error: { iconTheme: { primary: '#e53935', secondary: '#fff' } },
            }}/>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
