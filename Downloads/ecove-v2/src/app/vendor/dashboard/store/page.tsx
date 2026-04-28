'use client'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function VendorStorePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const slug = user?.vendor?.slug

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => api.get('/vendor/profile').then(r => r.data.data),
  })

  const avgRating = parseFloat(vendor?.averageRating || '0').toFixed(1)
  const positiveRate = vendor?.reviewCount > 0
    ? Math.round((vendor.reviewCount * parseFloat(avgRating)) / 5 * 100)
    : 0

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-center"><div className="text-4xl animate-pulse">🏪</div></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-xl font-extrabold text-gray-900">My Store Page</h1>
        {slug && (
          <a href={`/store/${slug}`} target="_blank" className="ml-auto text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 transition-colors">
            View Live Store →
          </a>
        )}
      </div>

      {/* Store preview card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="h-28 relative" style={{
          background: vendor?.bannerUrl
            ? `url(${vendor.bannerUrl}) center/cover`
            : 'linear-gradient(135deg, #d4720e, #f68b1f)',
        }}>
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="relative w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl overflow-hidden shrink-0">
              {vendor?.logoUrl ? <Image src={vendor.logoUrl} alt="" fill className="object-cover rounded-full" sizes="48px" /> : vendor?.businessName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">{vendor?.businessName}</h2>
              {vendor?.tagline && <p className="text-sm text-gray-500">{vendor.tagline}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              ['Products', vendor?._count?.products || 0, '🛍️'],
              ['Orders', vendor?.totalOrders || 0, '📦'],
              ['Rating', `★ ${avgRating}`, '⭐'],
              ['Positive', `${positiveRate}%`, '👍'],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">{icon}</div>
                <div className="text-base font-extrabold text-gray-800">{value}</div>
                <div className="text-[10px] text-gray-400">{label as string}</div>
              </div>
            ))}
          </div>

          {vendor?.description && (
            <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">{vendor.description}</p>
          )}
        </div>
      </div>

      {/* Performance metrics */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h2 className="font-bold text-sm text-gray-700 mb-4">Store Performance</h2>
        <div className="space-y-3">
          {[
            ['Customer Rating', `${avgRating} / 5.0`, Math.min(100, parseFloat(avgRating) / 5 * 100), '#f68b1f'],
            ['On-time Delivery', `${Math.round(parseFloat(vendor?.onTimeRate || '0'))}%`, parseFloat(vendor?.onTimeRate || '0'), '#1e8a44'],
            ['Response Rate', `${Math.round(parseFloat(vendor?.responseRate || '0'))}%`, parseFloat(vendor?.responseRate || '0'), '#1976d2'],
            ['Positive Feedback', `${positiveRate}%`, positiveRate, '#7c3aed'],
          ].map(([label, value, pct, color]) => (
            <div key={label as string}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{label as string}</span>
                <span className="font-bold" style={{ color: color as string }}>{value as string}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color as string }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store URL */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h2 className="font-bold text-sm text-gray-700 mb-3">Your Store URL</h2>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-600 flex-1 truncate">ecove.com.ng/store/<strong>{slug}</strong></span>
          <button onClick={() => { navigator.clipboard.writeText(`https://ecove.com.ng/store/${slug}`); toast.success('Copied!') }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white shrink-0" style={{ background: '#f68b1f' }}>
            Copy Link
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Share this link with customers to drive traffic to your store.</p>
      </div>

      <div className="flex gap-3">
        <Link href="/vendor/dashboard/profile" className="flex-1 py-3 rounded-xl text-sm font-bold text-center border-2 border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors">
          ✏️ Edit Store Profile
        </Link>
        <Link href="/vendor/dashboard/products/new" className="flex-1 py-3 rounded-xl text-white text-sm font-bold text-center" style={{ background: '#f68b1f' }}>
          + Add New Product
        </Link>
      </div>
    </div>
  )
}
