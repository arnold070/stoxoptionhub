'use client'
import Image from 'next/image'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/apiClient'
import Link from 'next/link'

function TrackContent() {
  const sp = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(sp.get('order') || '')
  const [email, setEmail]             = useState(sp.get('email') || '')
  const [order, setOrder]             = useState<any>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const STATUS_STEPS = ['pending','processing','shipped','out_for_delivery','delivered']
  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    pending:    { bg: '#fef3c7', color: '#92400e' },
    processing: { bg: '#dbeafe', color: '#1e40af' },
    shipped:    { bg: '#ede9fe', color: '#5b21b6' },
    out_for_delivery: { bg: '#fff4e6', color: '#d4720e' },
    delivered:  { bg: '#dcfce7', color: '#15803d' },
    cancelled:  { bg: '#fee2e2', color: '#991b1b' },
    refunded:   { bg: '#f3f4f6', color: '#374151' },
  }

  const track = async () => {
    if (!orderNumber.trim() || !email.trim()) { setError('Please enter both order number and email.'); return }
    setLoading(true); setError(''); setOrder(null)
    try {
      const res = await api.get(`/storefront/orders/${orderNumber}?email=${encodeURIComponent(email)}`)
      setOrder(res.data.data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Order not found. Check your order number and email.')
    } finally { setLoading(false) }
  }

  const stepIdx = order ? STATUS_STEPS.indexOf(order.status) : -1
  const s = order ? (STATUS_STYLE[order.status] || { bg: '#f3f4f6', color: '#374151' }) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📦</div>
        <h1 className="text-2xl font-extrabold text-gray-900">Track Your Order</h1>
        <p className="text-gray-500 text-sm mt-1">Enter your order number and email to check your order status</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Order Number</label>
            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
              placeholder="ECO-240101-12345"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email used at checkout"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={track} disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: '#f68b1f' }}>
            {loading ? 'Tracking…' : 'Track Order →'}
          </button>
        </div>
      </div>

      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-gray-900">{order.orderNumber}</h2>
              <p className="text-xs text-gray-400">Placed {new Date(order.createdAt).toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: s!.bg, color: s!.color }}>{order.status}</span>
          </div>

          {!['cancelled','refunded'].includes(order.status) && (
            <div className="mb-5">
              <div className="flex items-center">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIdx ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                        style={i <= stepIdx ? { background: '#f68b1f' } : {}}>
                        {i < stepIdx ? '✓' : i === stepIdx ? '●' : '○'}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 capitalize text-center max-w-[50px] leading-tight">{step.replace('_',' ')}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: i < stepIdx ? '#f68b1f' : '#e5e7eb' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-base shrink-0">
                  {item.productImage ? <Image src={item.productImage} alt="" fill className="object-cover rounded-lg" sizes="48px" /> : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} · by {item.vendorName}</p>
                </div>
                {item.trackingNumber && <p className="text-xs text-blue-600 shrink-0">🚚 {item.trackingNumber}</p>}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-extrabold text-orange-600">₦{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-400 mt-6">
        Have an account? <Link href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link> to track all your orders.
      </p>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-12 text-center"><div className="text-4xl animate-pulse">📦</div></div>}>
      <TrackContent />
    </Suspense>
  )
}
