'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#dbeafe', color: '#1e40af' },
  paid:     { bg: '#dcfce7', color: '#15803d' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  on_hold:  { bg: '#f3f4f6', color: '#374151' },
}

export default function AdminPayoutsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ id: string; act: string; vendor: string; amount: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', status, page],
    queryFn: () => api.get(`/admin/payouts?page=${page}&limit=20${status ? `&status=${status}` : ''}`).then(r => r.data),
  })

  const action = useMutation({
    mutationFn: ({ id, act, note, ref }: any) => api.patch(`/admin/payouts/${id}`, { action: act, adminNote: note, transferRef: ref }),
    onSuccess: (_, vars) => {
      toast.success(`Payout ${vars.act === 'mark_paid' ? 'marked as paid' : vars.act + 'd'}`)
      qc.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
  })

  const doAction = (id: string, act: string, vendor: string, amount: string) => {
    if (act === 'mark_paid' || act === 'reject') {
      setModal({ id, act, vendor, amount })
    } else {
      action.mutate({ id, act })
    }
  }

  const payouts = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Vendor Payouts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} requests</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[['pending','⏳ Pending'], ['approved','✅ Approved'], ['paid','💸 Paid'], ['rejected','❌ Rejected'], ['','All']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100"/>)
        ) : payouts.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">💰</div>
            <p className="font-semibold text-gray-600">No payout requests</p>
          </div>
        ) : payouts.map((p: import('@/types').Payout & { vendor: import('@/types').Vendor & { user: { email: string } } }) => {
          const s = STATUS_STYLE[p.status] || { bg: '#f3f4f6', color: '#374151' }
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#f68b1f' }}>{p.vendor?.businessName?.[0]}</div>
                  <div>
                    <p className="font-bold text-gray-900">{p.vendor?.businessName}</p>
                    <p className="text-xs text-gray-400">{p.vendor?.user?.email} · Requested {new Date(p.requestedAt).toLocaleDateString('en-NG')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: s.bg, color: s.color }}>{p.status}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-gray-800">₦{parseFloat(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Requested Amount</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-gray-700">{p.bankName}</p>
                  <p className="text-xs text-gray-400">{p.bankAccountNumber}</p>
                  <p className="text-xs text-gray-500">{p.bankAccountName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-gray-700">Available Balance</p>
                  <p className="text-xs font-extrabold text-green-600">₦{parseFloat(p.vendor?.availableBalance || 0).toLocaleString()}</p>
                  {p.transferRef && <p className="text-xs text-gray-400 mt-1">Ref: {p.transferRef}</p>}
                </div>
              </div>

              {p.adminNote && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">Admin note: {p.adminNote}</p>}

              {p.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => doAction(p.id, 'approve', p.vendor?.businessName, parseFloat(p.amount).toLocaleString())} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">✅ Approve</button>
                  <button onClick={() => doAction(p.id, 'mark_paid', p.vendor?.businessName, parseFloat(p.amount).toLocaleString())} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors" style={{ background: '#1e8a44' }}>💸 Approve & Mark Paid</button>
                  <button onClick={() => doAction(p.id, 'reject', '', '')} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">❌ Hold</button>
                </div>
              )}
              {p.status === 'approved' && (
                <button onClick={() => doAction(p.id, 'mark_paid', p.vendor?.businessName, parseFloat(p.amount).toLocaleString())} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#1e8a44' }}>💸 Mark as Paid</button>
              )}
            </div>
          )
        })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
          </div>
        </div>
      )}
    </div>
      <PromptModal
        open={!!modal}
        title={modal?.act === 'mark_paid' ? 'Mark as Paid' : 'Hold Payout'}
        label={modal?.act === 'mark_paid' ? `Bank transfer reference for ₦${modal?.amount} to ${modal?.vendor}:` : 'Reason for holding this payout:'}
        placeholder={modal?.act === 'mark_paid' ? 'e.g. TRF2024123456789' : 'e.g. Awaiting verification…'}
        confirmLabel={modal?.act === 'mark_paid' ? 'Mark as Paid' : 'Hold Payout'}
        danger={modal?.act === 'reject'}
        onConfirm={(val) => {
          if (modal) {
            if (modal.act === 'mark_paid') action.mutate({ id: modal.id, act: modal.act, ref: val })
            else action.mutate({ id: modal.id, act: modal.act, note: val })
          }
          setModal(null)
        }}
        onCancel={() => setModal(null)}
      />
  )
}
