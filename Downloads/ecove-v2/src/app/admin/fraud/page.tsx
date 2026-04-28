'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const SEV: Record<string, { bg: string; color: string; label: string }> = {
  low:      { bg: '#f3f4f6', color: '#374151', label: 'Low' },
  medium:   { bg: '#fef3c7', color: '#92400e', label: 'Medium' },
  high:     { bg: '#fee2e2', color: '#991b1b', label: 'High' },
  critical: { bg: '#7f1d1d', color: '#fff',    label: 'Critical' },
}
const ICONS: Record<string, string> = { vendor: '🏪', product: '📦', order: '🧾', user: '👤', review: '⭐' }

export default function AdminFraudPage() {
  const qc = useQueryClient()
  const [resolved, setResolved] = useState(false)
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ entityType: 'vendor', entityId: '', reason: '', severity: 'medium', note: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fraud', resolved, entityType, page],
    queryFn:  () => api.get(`/admin/fraud?page=${page}&limit=20&resolved=${resolved}${entityType ? `&entityType=${entityType}` : ''}`).then(r => r.data),
  })

  const resolve = useMutation({
    mutationFn: ({ id, action }: any) => api.patch('/admin/fraud', { id, action }),
    onSuccess:  () => { toast.success('Flag updated'); qc.invalidateQueries({ queryKey: ['admin-fraud'] }) },
  })

  const create = useMutation({
    mutationFn: (body: any) => api.post('/admin/fraud', body),
    onSuccess:  () => {
      toast.success('Flag created')
      setCreating(false)
      setForm({ entityType: 'vendor', entityId: '', reason: '', severity: 'medium', note: '' })
      qc.invalidateQueries({ queryKey: ['admin-fraud'] })
    },
  })

  const flags = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">🛡️ Fraud Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage suspicious activity flags</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600">
          + Flag Entity
        </button>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="font-bold text-base mb-4">Create Fraud Flag</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Entity Type</label>
                  <select value={form.entityType} onChange={e => setForm(f => ({ ...f, entityType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    {['vendor','product','order','user','review'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    {['low','medium','high','critical'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Entity ID</label>
                <input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))}
                  placeholder="UUID of the entity" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Describe the suspicious activity"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Internal Note (optional)</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCreating(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => create.mutate(form)}
                disabled={!form.entityId || !form.reason || create.isPending}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-orange-500 disabled:opacity-50">
                {create.isPending ? 'Creating…' : 'Create Flag'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ label: 'Open', val: false }, { label: 'Resolved', val: true }].map(opt => (
            <button key={String(opt.val)} onClick={() => { setResolved(opt.val); setPage(1) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${resolved === opt.val ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="">All Types</option>
          {['vendor','product','order','user','review'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : flags.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <p className="font-semibold text-gray-700">No {resolved ? 'resolved' : 'open'} flags</p>
            <p className="text-sm text-gray-400 mt-1">{resolved ? 'Resolved flags appear here.' : 'No active fraud flags — all clear!'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flags.map((flag: any) => {
              const sev = SEV[flag.severity] || SEV.medium
              return (
                <div key={flag.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">{ICONS[flag.entityType] || '❓'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                      <span className="text-xs font-semibold text-gray-500 capitalize">{flag.entityType}</span>
                      <span className="text-xs text-gray-400 font-mono">{flag.entityId?.slice(0,8)}…</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{flag.reason}</p>
                    {flag.note && <p className="text-xs text-gray-500 mt-0.5">Note: {flag.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(flag.createdAt).toLocaleString('en-NG')}</p>
                  </div>
                  {!flag.isResolved ? (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => resolve.mutate({ id: flag.id, action: 'escalate' })}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-red-200 text-red-600 hover:bg-red-50">
                        Escalate
                      </button>
                      <button onClick={() => resolve.mutate({ id: flag.id, action: 'resolve' })}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700">
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-semibold shrink-0">✓ Resolved</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{pagination.total} flags</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
