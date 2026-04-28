'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'

function Stars({ n }: { n: number }) {
  return <span className="text-yellow-400 text-sm">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export default function VendorReviewsPage() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-reviews', filter, page],
    queryFn:  () => api.get(`/vendor/reviews?page=${page}&limit=20${filter ? `&rating=${filter}` : ''}`).then(r => r.data),
  })

  const reviews    = data?.data || []
  const pagination = data?.pagination
  const summary    = data?.summary

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">Customer Reviews</h1>
        <p className="text-sm text-gray-500 mt-0.5">Feedback from customers who bought your products</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Average Rating', value: summary?.averageRating ? `★ ${summary.averageRating}` : '—', color: '#f59e0b' },
          { label: 'Total Reviews',  value: summary?.total ?? 0,         color: '#1976d2' },
          { label: '4–5 Stars',      value: summary?.fiveAndFour ?? 0,   color: '#1e8a44' },
          { label: '1–2 Stars',      value: summary?.oneAndTwo ?? 0,     color: '#e53935' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ label: 'All', val: '' }, { label: '5 ★', val: '5' }, { label: '4 ★', val: '4' },
          { label: '3 ★', val: '3' }, { label: '1–2 ★', val: 'low' }].map(opt => (
          <button key={opt.val} onClick={() => { setFilter(opt.val); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
              filter === opt.val ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}>{opt.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="font-semibold text-gray-700">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Customer reviews appear here after delivery.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((r: any) => (
              <div key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Stars n={r.rating} />
                      {r.isVerifiedPurchase && (
                        <span className="text-xs bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>
                      )}
                    </div>
                    {r.title && <p className="font-semibold text-gray-800 text-sm">{r.title}</p>}
                    {r.body  && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.body}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{r.user?.firstName ?? r.guestName ?? 'Anonymous'}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 mb-0.5">Product</p>
                    <p className="text-xs font-semibold text-gray-700 max-w-36 text-right truncate">{r.product?.name ?? 'Deleted'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{pagination.total} reviews</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-gray-500">Page {page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
