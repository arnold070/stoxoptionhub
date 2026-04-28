'use client'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import api from '@/lib/apiClient'
import Image from 'next/image'
import Link from 'next/link'
import type { Order } from '@/types'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery: { bg: '#fff4e6', color: '#d4720e' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
  refunded:   { bg: '#f3f4f6', color: '#374151' },
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/storefront/orders?limit=50').then(r => r.data.data),
    enabled: !!user,
  })

  if (!loading && !user) {
    router.replace('/login?next=/orders')
    return null
  }

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">My Orders</h1>
        <Link href="/account" className="text-sm text-gray-400 hover:text-gray-600">← Account</Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-sm mb-8">Your orders will appear here after you make a purchase.</p>
          <Link href="/search" className="inline-block px-8 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const s = STATUS_STYLE[order.status] || { bg: '#f3f4f6', color: '#374151' }
            return (
              <Link key={order.id} href={`/orders/${order.orderNumber}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-orange-200 transition-all">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-gray-900">
                      ₦{parseFloat(String(order.total)).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Item thumbnails */}
                <div className="flex gap-2 items-center">
                  {order.items?.slice(0, 4).map((item) => (
                    <div key={item.id} className="relative w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {item.productImage
                        ? <Image src={item.productImage} alt={item.productName} fill className="w-full h-full object-cover" sizes="200px" />
                        : <span className="text-xl">📦</span>}
                    </div>
                  ))}
                  {(order.items?.length ?? 0) > 4 && (
                    <div className="relative w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-500 font-bold shrink-0">
                      +{(order.items?.length ?? 0) - 4}
                    </div>
                  )}
                  <span className="ml-auto text-xs text-orange-500 font-semibold">View details →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
