'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Review } from '@/types'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import Link from 'next/link'

export default function AdminReviewsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [flagModal, setFlagModal] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', status, page],
    queryFn: () => api.get(`/admin/reviews?page=${page}&limit=20&status=${status}`).then(r => r.data),
  })

  const moderate = useMutation({
    mutationFn: ({ id, action, flagReason }: any) => api.patch('/admin/reviews', { id, action, flagReason }),
    onSuccess: (_, vars) => {
      toast.success(`Review ${vars.action}d`)
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
  })

  const reviews = data?.data || []
  const pagination = data?.pagination

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Review Moderation</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} reviews</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[['pending', '⏳ Pending'], ['flagged', '🚩 Flagged'], ['approved', '✅ Approved'], ['rejected', '❌ Rejected'], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />)
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">⭐</div>
            <p className="font-semibold text-gray-600">No reviews to moderate</p>
          </div>
        ) : reviews.map((r: import('@/types').Review) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-sm">{stars(r.rating)}</span>
                  <span className="font-bold text-sm text-gray-900">{r.rating}/5</span>
                  {r.isVerifiedPurchase && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">✓ Verified Purchase</span>}
                </div>
                <p className="text-xs text-gray-400">
                  by {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Guest'}
                  {r.product && <> · on <Link href={`/products/${r.product.slug}`} className="text-orange-500 hover:underline">{r.product.name}</Link></>}
                  {' · '}{new Date(r.createdAt).toLocaleDateString('en-NG')}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                r.status === 'approved' ? 'bg-green-100 text-green-700' :
                r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                r.status === 'flagged' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{r.status}</span>
            </div>
            {r.title && <p className="font-semibold text-sm text-gray-800 mb-1">"{r.title}"</p>}
            {r.body && <p className="text-sm text-gray-600 leading-relaxed mb-3 bg-gray-50 rounded-lg p-3">{r.body}</p>}
            {r.flagReason && <p className="text-xs text-red-500 mb-3">🚩 Flag reason: {r.flagReason}</p>}
            {r.status !== 'approved' && r.status !== 'rejected' && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => moderate.mutate({ id: r.id, action: 'approve' })}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">
                  ✅ Approve
                </button>
                <button onClick={() => moderate.mutate({ id: r.id, action: 'reject' })}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                  ❌ Reject
                </button>
                <button onClick={() => setFlagModal(r.id)} className="text-xs px-3 py-1.5 rounded-lg font-bold bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white transition-colors">
                  🚩 Flag
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
          </div>
        </div>
      )}
    </div>
      <PromptModal
        open={!!flagModal}
        title="Flag Review"
        label="Flag reason:"
        placeholder="e.g. Spam, fake review, inappropriate content…"
        confirmLabel="Flag Review"
        danger
        onConfirm={(reason) => {
          if (flagModal) moderate.mutate({ id: flagModal, action: 'flag', flagReason: reason })
          setFlagModal(null)
        }}
        onCancel={() => setFlagModal(null)}
      />
  )
}
