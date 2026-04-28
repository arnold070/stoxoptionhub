'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  requested:  { bg: '#fef3c7', color: '#92400e', label: 'Requested' },
  approved:   { bg: '#dbeafe', color: '#1e40af', label: 'Approved' },
  rejected:   { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  processing: { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' },
  completed:  { bg: '#dcfce7', color: '#15803d', label: 'Completed' },
}

export default function VendorReturnsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-returns', status, page],
    queryFn:  () =>
      api.get(`/vendor/returns?page=${page}&limit=20${status ? `&status=${status}` : ''}`)
         .then(r => r.data)
         .catch(() => ({ data: [], pagination: null })),
  })

  const update = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/vendor/returns/${id}`, { action }),
    onSuccess: (_, v) => {
      toast.success(`Return ${v.action}d`)
      qc.invalidateQueries({ queryKey: ['vendor-returns'] })
    },
  })

  const returns    = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">Returns Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage customer return requests for your orders</p>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3 mb-6">
        <span className="text-blue-500 text-lg shrink-0">ℹ️</span>
        <p className="text-sm text-blue-700">
          Customers have <strong>7 days</strong> from delivery to request a return. Accepted returns are refunded after the item is received and inspected.
          Contact <a href="mailto:support@ecove.com.ng" className="underline">support@ecove.com.ng</a> for disputes.
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ label: 'All', val: '' }, ...Object.entries(STATUS).map(([v, s]) => ({ label: s.label, val: v }))].map(opt => (
          <button key={opt.val} onClick={() => { setStatus(opt.val); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
              status === opt.val ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}>{opt.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🔄</div>
            <p className="font-semibold text-gray-700">No return requests</p>
            <p className="text-sm text-gray-400 mt-1">All your orders have been fulfilled without returns.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {returns.map((ret: any) => {
              const s = STATUS[ret.status] || STATUS.requested
              return (
                <div key={ret.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        <span className="text-xs font-mono text-gray-400">#{ret.orderNumber ?? ret.id?.slice(0,8)}</span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{ret.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {ret.quantity} · ₦{Number(ret.totalPrice).toLocaleString()}</p>
                      {ret.returnReason && <p className="text-xs text-gray-500 mt-1">Reason: <span className="font-medium">{ret.returnReason}</span></p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(ret.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {ret.status === 'requested' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => update.mutate({ id: ret.id, action: 'reject' })}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-red-200 text-red-600 hover:bg-red-50">
                          Reject
                        </button>
                        <button onClick={() => update.mutate({ id: ret.id, action: 'approve' })}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700">
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{pagination.total} returns</span>
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
