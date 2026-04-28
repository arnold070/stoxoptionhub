'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { User } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminCustomersPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', q, page],
    queryFn: () => api.get(`/admin/customers?page=${page}&limit=25${q ? `&q=${q}` : ''}`).then(r => r.data),
  })

  const qc = useQueryClient()
  const toggleStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) =>
      api.patch('/admin/customers', { id, action }),
    onSuccess: (_, vars) => {
      toast.success(`Customer ${vars.action === 'activate' ? 'activated' : 'suspended'}.`)
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
    },
  })

  const customers = data?.data || []
  const pagination = data?.pagination

  const exportCsv = async () => {
    try {
      // Fetch all customers for export (no pagination limit)
      const res = await api.get(`/admin/customers?limit=10000${q ? `&q=${q}` : ''}`)
      const all: any[] = res.data.data || []
      const headers = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Status', 'Joined']
      const rows = all.map(c => [
        `${c.firstName} ${c.lastName}`,
        c.email,
        c.phone || '',
        c._count?.orders || 0,
        c._sum?.total || 0,
        c.isActive ? 'Active' : 'Suspended',
        new Date(c.createdAt).toLocaleDateString('en-NG'),
      ])
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `ecove-customers-${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} registered customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">📥 Export CSV</button>
        </div>
      </div>

      <div className="mb-5">
        <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder="Search by name or email…"
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-72" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-semibold text-gray-600">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Orders</th>
                <th className="px-5 py-3 text-left">Total Spent</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c: import('@/types').User & { _count: { orders: number }; totalSpent: number }) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: '#f68b1f' }}>
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-semibold text-sm text-gray-800">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{c.phone || '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{c._count?.orders || 0}</td>
                    <td className="px-5 py-4 text-sm font-bold" style={{ color: '#d4720e' }}>
                      ₦{(c.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-NG')}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {c.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {c.isActive ? (
                        <button
                          onClick={() => { if (confirm(`Suspend ${c.firstName} ${c.lastName}?`)) toggleStatus.mutate({ id: c.id, action: 'deactivate' }) }}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStatus.mutate({ id: c.id, action: 'activate' })}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-green-50 text-green-700 hover:bg-green-500 hover:text-white transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages} · {pagination.total} customers</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
