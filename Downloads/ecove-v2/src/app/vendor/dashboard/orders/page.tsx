'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { OrderItem, Order } from '@/types'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: '#92400e', processing: '#1e40af', shipped: '#5b21b6',
  out_for_delivery: '#92400e', delivered: '#15803d', cancelled: '#991b1b',
}
const STATUS_BG: Record<string, string> = {
  pending: '#fef3c7', processing: '#dbeafe', shipped: '#ede9fe',
  out_for_delivery: '#fef3c7', delivered: '#dcfce7', cancelled: '#fee2e2',
}

export default function VendorOrdersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [trackingModal, setTrackingModal] = useState<{ itemId: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', page, status],
    queryFn: () => api.get(`/vendor/orders?page=${page}&limit=20${status ? `&status=${status}` : ''}`).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, fulfillmentStatus, trackingNumber }: any) =>
      api.patch(`/vendor/orders/${id}`, { fulfillmentStatus, trackingNumber }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-orders'] }); toast.success('Order updated') },
  })

  const items = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} total orders</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {[['', 'All'], ['pending', 'Pending'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
            style={status === val ? { background: '#f68b1f' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-semibold text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Total</th>
                  <th className="px-5 py-3 text-left">Your Earning</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: import('@/types').OrderItem & { order: { orderNumber: string; createdAt: string } }) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm text-gray-800">{item.order?.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('en-NG')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800 max-w-[180px] truncate">{item.productName}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {item.order?.shippingAddress ? `${item.order.shippingAddress.firstName} ${item.order.shippingAddress.lastName}` : '—'}
                    </td>
                    <td className="px-5 py-4 font-bold text-sm">₦{parseFloat(item.totalPrice).toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-sm text-green-600">₦{parseFloat(item.vendorEarning).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: STATUS_BG[item.fulfillmentStatus] || '#f3f4f6', color: STATUS_COLORS[item.fulfillmentStatus] || '#374151' }}>
                        {item.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.fulfillmentStatus === 'processing' && (
                        <button
                          onClick={() => setTrackingModal({ itemId: item.id })}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold text-white"
                          style={{ background: '#7c3aed' }}
                        >
                          Mark Shipped
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
      <PromptModal
        open={!!trackingModal}
        title="Mark as Shipped"
        label="Tracking number (optional)"
        placeholder="e.g. GIG-123456789"
        confirmLabel="Mark Shipped"
        onConfirm={(tracking) => {
          if (trackingModal) updateStatus.mutate({ id: trackingModal.itemId, fulfillmentStatus: 'shipped', trackingNumber: tracking })
          setTrackingModal(null)
        }}
        onCancel={() => setTrackingModal(null)}
      />
  )
}
