import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Access Denied – Ecove',
  robots: 'noindex',
}

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-6">You don't have permission to access this page.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>Go Home</Link>
          <Link href="/login" className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
