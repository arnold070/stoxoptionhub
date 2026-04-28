'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import type { Vendor } from '@/types'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved:  { bg: '#dcfce7', color: '#15803d' },
  pending:   { bg: '#fef3c7', color: '#92400e' },
  rejected:  { bg: '#fee2e2', color: '#991b1b' },
  suspended: { bg: '#fee2e2', color: '#991b1b' },
}

export default function AdminVendorsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ id: string; act: string; title: string; label: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', status, q, page],
    queryFn: () => api.get(`/admin/vendors?page=${page}&limit=20${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`).then(r => r.data),
  })

  const action = useMutation({
    mutationFn: ({ id, act, note }: { id: string; act: string; note?: string }) => api.patch(`/admin/vendors/${id}`, { action: act, statusNote: note }),
    onSuccess: (_, vars) => {
      toast.success(`Vendor ${vars.act}d`)
      qc.invalidateQueries({ queryKey: ['admin-vendors'] })
    },
  })

  const vendors = data?.data || []
  const pagination = data?.pagination

  const doAction = (id: string, act: string) => {
    if (['reject', 'suspend'].includes(act)) {
      setModal({ id, act, title: act === 'reject' ? 'Reject Vendor' : 'Suspend Vendor', label: `Reason (sent to vendor):` })
    } else {
      action.mutate({ id, act })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} total vendors</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[['', 'All'], ['pending', '⏳ Pending'], ['approved', '✅ Active'], ['suspended', '⏸ Suspended'], ['rejected', '❌ Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search vendors…"
            className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-48" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">🏪</div>
            <p className="font-semibold text-gray-600">No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Products</th>
                <th className="px-5 py-3 text-left">Total Sales</th>
                <th className="px-5 py-3 text-left">Rating</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map((v: import('@/types').Vendor) => {
                  const s = STATUS_STYLE[v.status] || { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: '#f68b1f' }}>{v.businessName[0]}</div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{v.businessName}</p>
                            <p className="text-xs text-gray-400">{v.city}, {v.state}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{v.user?.firstName} {v.user?.lastName}<br/><span className="text-xs text-gray-400">{v.user?.email}</span></td>
                      <td className="px-5 py-4 text-sm font-semibold">{v._count?.products || 0}</td>
                      <td className="px-5 py-4 text-sm font-bold" style={{ color: '#d4720e' }}>₦{parseFloat(v.totalSales || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm"><span className="text-yellow-400">★</span> {parseFloat(v.averageRating || 0).toFixed(1)}</td>
                      <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{v.status}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString('en-NG')}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {v.status === 'pending' && <>
                            <button onClick={() => doAction(v.id, 'approve')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">✅ Approve</button>
                            <button onClick={() => doAction(v.id, 'reject')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">❌ Reject</button>
                          </>}
                          {v.status === 'approved' && <button onClick={() => doAction(v.id, 'suspend')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-600 hover:text-white transition-colors">⏸ Suspend</button>}
                          {v.status === 'suspended' && <button onClick={() => doAction(v.id, 'activate')} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">▶ Activate</button>}
                          <Link href={`/store/${v.slug}`} target="_blank" className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors">🏪 Store</Link>
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
            <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages} · {pagination.total} vendors</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
      <PromptModal
        open={!!modal}
        title={modal?.title || ''}
        label={modal?.label || ''}
        placeholder="Enter reason…"
        confirmLabel={modal?.act === 'reject' ? 'Reject Vendor' : 'Suspend Vendor'}
        danger
        onConfirm={(note) => {
          if (modal) action.mutate({ id: modal.id, act: modal.act, note })
          setModal(null)
        }}
        onCancel={() => setModal(null)}
      />
  )
}
