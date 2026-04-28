'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Order } from '@/types'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery: { bg: '#fff4e6', color: '#d4720e' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
  refunded:   { bg: '#f3f4f6', color: '#374151' },
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, q, page],
    queryFn: () => api.get(`/admin/orders?page=${page}&limit=25${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`).then(r => r.data),
  })

  const orders = data?.data || []
  const pagination = data?.pagination

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} total orders</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        {[['','All'], ['pending','Pending'], ['processing','Processing'], ['shipped','Shipped'], ['delivered','Delivered'], ['cancelled','Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
        <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Order # or customer email…"
          className="ml-auto px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-56" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Order #</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Vendors</th>
                <th className="px-5 py-3 text-left">Items</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Payment</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o: import('@/types').Order) => {
                  const s = STATUS_STYLE[o.status] || { bg: '#f3f4f6', color: '#374151' }
                  const vendors = [...new Set(o.items?.map((i: any) => i.vendor?.businessName).filter(Boolean))]
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <Link href={`/orders/${o.orderNumber}`} target="_blank"
                          className="font-bold text-sm text-orange-600 hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <p className="font-medium">{o.user ? `${o.user.firstName} ${o.user.lastName}` : o.guestEmail || 'Guest'}</p>
                        <p className="text-xs text-gray-400">{o.user?.email || o.guestEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-orange-600 font-semibold max-w-[140px]">{vendors.slice(0, 2).join(', ')}{vendors.length > 2 ? ` +${vendors.length - 2}` : ''}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                      <td className="px-5 py-4 font-bold text-sm">₦{parseFloat(o.total).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{o.status}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-NG')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <div className="text-4xl mb-2">📦</div>
                <p className="font-semibold text-gray-600">No orders found</p>
              </div>
            )}
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages} · {pagination.total} orders</span>
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
