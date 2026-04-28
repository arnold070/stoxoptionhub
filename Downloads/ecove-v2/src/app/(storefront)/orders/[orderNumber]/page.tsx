'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered']
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:          { bg: '#fef3c7', color: '#92400e' },
  processing:       { bg: '#dbeafe', color: '#1e40af' },
  shipped:          { bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery: { bg: '#fff4e6', color: '#d4720e' },
  delivered:        { bg: '#dcfce7', color: '#15803d' },
  cancelled:        { bg: '#fee2e2', color: '#991b1b' },
  refunded:         { bg: '#f3f4f6', color: '#374151' },
}

export default function OrderDetailPage({ params }: { params: { orderNumber: string } }) {
  // ALL hooks must be called unconditionally at the top level
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['order', params.orderNumber],
    queryFn: () => api.get(`/storefront/orders/${params.orderNumber}`).then(r => r.data.data),
  })

  const cancel = useMutation({
    mutationFn: () => api.patch(`/storefront/orders/${params.orderNumber}`, {}),
    onSuccess: () => {
      toast.success('Order cancelled.')
      qc.invalidateQueries({ queryKey: ['order', params.orderNumber] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Could not cancel order.'),
  })

  // Conditional renders AFTER all hooks
  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <div className="text-4xl animate-pulse mb-3">📦</div>
      <p className="text-gray-400">Loading order…</p>
    </div>
  )

  if (!data) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-500">Order not found. <Link href="/account" className="text-orange-500 underline">Back to account</Link></p>
    </div>
  )

  const order  = data
  const addr   = order.shippingAddress
  const stepIdx = STATUS_STEPS.indexOf(order.status)
  const s      = STATUS_STYLE[order.status] || { bg: '#f3f4f6', color: '#374151' }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/account" className="text-sm text-gray-400 hover:text-gray-600">← My Orders</Link>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Placed {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: s.bg, color: s.color }}>{order.status}</span>
      </div>

      {/* Progress tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2 className="font-bold text-sm text-gray-700 mb-4">Order Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= stepIdx ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={i <= stepIdx ? { background: '#f68b1f' } : {}}
                  >
                    {i < stepIdx ? '✓' : i === stepIdx ? '●' : '○'}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 capitalize text-center leading-tight max-w-[60px]">{step.replace('_', ' ')}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: i < stepIdx ? '#f68b1f' : '#e5e7eb' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm">Items Ordered</div>
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
            <div className="relative w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {item.productImage
                ? <Image src={item.productImage} alt="" fill className="object-cover" sizes="56px" />
                : <span className="text-2xl">📦</span>}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
              <p className="text-xs text-gray-400">by {item.vendorName} · Qty: {item.quantity}</p>
              {item.trackingNumber && <p className="text-xs text-blue-600 mt-0.5">Tracking: {item.trackingNumber}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">₦{parseFloat(item.totalPrice).toLocaleString()}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: STATUS_STYLE[item.fulfillmentStatus]?.bg || '#f3f4f6', color: STATUS_STYLE[item.fulfillmentStatus]?.color || '#374151' }}>
                {item.fulfillmentStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Shipping address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-3">Delivery Address</h2>
          {addr && (
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">{addr.firstName} {addr.lastName}</p>
              <p>{addr.phone}</p>
              <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
              <p>{addr.city}, {addr.state}</p>
              <p>{addr.country}</p>
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-3">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₦{parseFloat(order.subtotal).toLocaleString()}</span></div>
            {parseFloat(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₦{parseFloat(order.discount).toLocaleString()}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{parseFloat(order.shippingFee) === 0 ? 'Free' : `₦${parseFloat(order.shippingFee).toLocaleString()}`}</span></div>
            <div className="flex justify-between font-extrabold text-base border-t pt-2 mt-2">
              <span>Total Paid</span>
              <span className="text-orange-600">₦{parseFloat(order.total).toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-400 pt-1">
              Payment: <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span>
              {order.paymentRef && <span> · Ref: {order.paymentRef}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel order */}
      {['pending', 'processing'].includes(order.status) && order.paymentStatus !== 'paid' && (
        <div className="mt-5 bg-red-50 border border-red-100 rounded-2xl p-5">
          <h2 className="font-bold text-sm text-red-700 mb-1">Cancel Order</h2>
          <p className="text-xs text-red-500 mb-3">This order has not been shipped yet. You can cancel it now.</p>
          <button
            onClick={() => { if (confirm('Are you sure you want to cancel this order?')) cancel.mutate() }}
            disabled={cancel.isPending}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel This Order'}
          </button>
        </div>
      )}
    </div>
  )
}
