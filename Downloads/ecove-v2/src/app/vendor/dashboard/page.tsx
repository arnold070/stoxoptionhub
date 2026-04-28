'use client'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/apiClient'
import Link from 'next/link'

export default function VendorDashboard() {
  const { user } = useAuth()
  const vendor = user?.vendor

  const { data: products } = useQuery({
    queryKey: ['vendor-products-summary'],
    queryFn:  () => api.get('/vendor/products?limit=5').then(r => r.data),
    enabled:  !!vendor,
  })

  const { data: orders } = useQuery({
    queryKey: ['vendor-orders-recent'],
    queryFn:  () => api.get('/vendor/orders?limit=5').then(r => r.data),
    enabled:  !!vendor,
  })

  const { data: profile } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn:  () => api.get('/vendor/profile').then(r => r.data.data),
    enabled:  !!vendor,
  })

  const balance   = parseFloat(profile?.availableBalance || '0')
  const pending   = parseInt(products?.data?.filter((p: any) => p.status === 'pending').length || '0')
  const rejected  = products?.data?.filter((p: any) => p.status === 'rejected') || []
  const statusColors: Record<string, { background: string; color: string }> = {
    approved:  { background: '#dcfce7', color: '#15803d' },
    pending:   { background: '#fef3c7', color: '#92400e' },
    rejected:  { background: '#fee2e2', color: '#991b1b' },
    processing:{ background: '#dbeafe', color: '#1e40af' },
    shipped:   { background: '#ede9fe', color: '#5b21b6' },
    delivered: { background: '#dcfce7', color: '#15803d' },
  }

  return (
    <div>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-500 text-sm mt-1">{vendor?.businessName}</p>
        </div>

        {/* Notices */}
        {pending > 0 && (
          <div className="mb-4 p-4 rounded-xl text-sm font-medium flex gap-3" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <span>⏳</span>
            <span><strong>{pending} product{pending > 1 ? 's' : ''}</strong> awaiting admin review. You&apos;ll be notified once approved.</span>
          </div>
        )}
        {rejected.length > 0 && (
          <div className="mb-4 p-4 rounded-xl text-sm font-medium flex gap-3" style={{ background: '#fee2e2', borderLeft: '4px solid #e53935' }}>
            <span>❌</span>
            <span><strong>{rejected.length} product{rejected.length > 1 ? 's' : ''}</strong> were rejected. <Link href="/vendor/dashboard/products" className="underline font-bold">Edit and resubmit →</Link></span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '💰', label: 'Available Balance', value: `₦${balance.toLocaleString()}`, color: '#f68b1f' },
            { icon: '📦', label: 'Total Orders',      value: profile?.totalOrders || 0,        color: '#1976d2' },
            { icon: '🛍️', label: 'Live Products',     value: products?.data?.filter((p: any) => p.status === 'approved').length || 0, color: '#1e8a44' },
            { icon: '⭐', label: 'Avg Rating',         value: `${parseFloat(profile?.averageRating || '0').toFixed(1)} / 5`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3 items-start hover:-translate-y-0.5 transition-transform">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: s.color + '22' }}>{s.icon}</div>
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Payout card */}
          <div className="rounded-xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #d4720e, #f68b1f)' }}>
            <div className="absolute right-4 bottom-2 text-8xl font-extrabold opacity-10">₦</div>
            <div className="text-sm opacity-80 mb-1">Available for withdrawal</div>
            <div className="text-4xl font-extrabold mb-1">₦{balance.toLocaleString()}</div>
            <div className="text-xs opacity-70 mb-4">Cleared funds after 7-day hold</div>
            <Link href="/vendor/dashboard/payouts"
              className="inline-block bg-white font-bold text-sm px-5 py-2.5 rounded-xl"
              style={{ color: '#d4720e' }}>
              Request Withdrawal →
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/vendor/dashboard/products/new', label: '➕ Add Product', bg: '#fff4e6', text: '#d4720e', border: '#f68b1f' },
                { href: '/vendor/dashboard/orders',       label: '📦 View Orders', bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
                { href: '/vendor/dashboard/inventory',    label: '📊 Inventory',   bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
                { href: `/store/${vendor?.slug}`,         label: '🏪 My Store',    bg: '#fdf4ff', text: '#7e22ce', border: '#d8b4fe' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="p-3 rounded-xl text-sm font-semibold text-center border transition-opacity hover:opacity-80"
                  style={{ background: a.bg, color: a.text, borderColor: a.border }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent orders & products */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold">Recent Orders</h2>
              <Link href="/vendor/dashboard/orders" className="text-xs font-semibold" style={{ color: '#f68b1f' }}>View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(orders?.data || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="px-5 py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold">{item.order?.orderNumber}</div>
                    <div className="text-xs text-gray-400">{item.productName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">₦{parseFloat(item.vendorEarning).toLocaleString()}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={statusColors[item.fulfillmentStatus] || { background: '#f3f4f6', color: '#374151' }}>
                      {item.fulfillmentStatus}
                    </span>
                  </div>
                </div>
              ))}
              {!orders?.data?.length && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold">My Products</h2>
              <Link href="/vendor/dashboard/products" className="text-xs font-semibold" style={{ color: '#f68b1f' }}>View all →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(products?.data || []).slice(0, 5).map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex justify-between items-center text-sm">
                  <div className="font-semibold truncate max-w-[200px]">{p.name}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold">₦{parseFloat(p.price).toLocaleString()}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={statusColors[p.status] || { background: '#f3f4f6', color: '#374151' }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
              {!products?.data?.length && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  No products yet. <Link href="/vendor/dashboard/products/new" className="text-orange-500 underline">Add your first product →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
