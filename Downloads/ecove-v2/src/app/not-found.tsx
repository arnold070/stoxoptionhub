import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">🛍️</div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>← Back to Homepage</Link>
          <Link href="/search" className="px-6 py-3 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">Browse Products</Link>
        </div>
      </div>
    </div>
  )
}
