'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved: { bg: '#dcfce7', color: '#15803d' },
  pending:  { bg: '#fef3c7', color: '#92400e' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  draft:    { bg: '#f3f4f6', color: '#374151' },
  suspended:{ bg: '#fee2e2', color: '#991b1b' },
}

export default function AdminProductsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [rejectModal, setRejectModal] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', status, q, page],
    queryFn: () => api.get(`/admin/products?page=${page}&limit=20${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`).then(r => r.data),
  })

  const action = useMutation({
    mutationFn: ({ id, act, note }: any) => api.patch(`/admin/products/${id}`, { action: act, adminNote: note }),
    onSuccess: (_, vars) => {
      toast.success(`Product ${vars.act}d`)
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  const doAction = (id: string, act: string) => {
    if (act === 'reject') {
      setRejectModal(id)
    } else {
      action.mutate({ id, act })
    }
  }

  const products = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} products</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        {[['pending','⏳ Pending Approval'], ['approved','✅ Live'], ['rejected','❌ Rejected'], ['','All']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
        <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search products…"
          className="ml-auto px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-52" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">🛍️</div>
            <p className="font-semibold text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Stock</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Submitted</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p: import('@/types').Product) => {
                  const s = STATUS_STYLE[p.status] || { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-lg shrink-0">
                            {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="32px" /> : '📦'}
                          </div>
                          <p className="text-sm font-semibold text-gray-800 max-w-[160px] truncate">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-orange-600 font-semibold">{p.vendor?.businessName}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{p.category?.name || '—'}</td>
                      <td className="px-5 py-4 text-sm font-bold">₦{parseFloat(p.price).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm">{p.stock}</td>
                      <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{p.status}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-NG')}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {p.status === 'pending' && <>
                            <button onClick={() => doAction(p.id, 'approve')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">✅ Approve</button>
                            <button onClick={() => doAction(p.id, 'reject')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">❌ Reject</button>
                          </>}
                          {p.status === 'approved' && <button onClick={() => doAction(p.id, 'suspend')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-600 hover:text-white transition-colors">⏸ Suspend</button>}
                          <Link href={`/products/${p.slug}`} target="_blank" className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors">👁 View</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
      <PromptModal
        open={!!rejectModal}
        title="Reject Product"
        label="Reason (sent to vendor so they can fix and resubmit):"
        placeholder="e.g. Images are too low quality, description is incomplete…"
        confirmLabel="Reject Product"
        danger
        onConfirm={(note) => {
          if (rejectModal) action.mutate({ id: rejectModal, act: 'reject', note })
          setRejectModal(null)
        }}
        onCancel={() => setRejectModal(null)}
      />
  )
}
