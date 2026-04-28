'use client'
import type { Order, Product } from '@/types'
import Image from 'next/image'
import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/apiClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#ede9fe', color: '#5b21b6' },
  delivered:  { bg: '#dcfce7', color: '#15803d' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
}

function AccountContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as 'orders' | 'profile' | 'wishlist' | null
  const [tab, setTab] = useState<'orders' | 'profile' | 'wishlist' | 'addresses'>(urlTab as any || 'orders')

  const { data: addressesData, refetch: refetchAddresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data.data as any[]),
    enabled: !!user,
  })

  const { data: wishlistData } = useQuery({
    queryKey: ['my-wishlist'],
    queryFn: () => api.get('/wishlist').then(r => r.data.data as any[]),
    enabled: !!user && tab === 'wishlist',
  })

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/storefront/orders').then(r => r.data.data),
    enabled: !!user,
  })

  if (!user) {
    router.replace('/login?next=/account')
    return null
  }

  const orders = ordersData || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white text-xl" style={{ background: '#f68b1f' }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{user.firstName} {user.lastName}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-600 font-medium">Sign Out</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {(['orders', 'profile', 'addresses', 'wishlist'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${tab === t ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {t === 'orders' ? '📦 My Orders' : t === 'profile' ? '👤 Profile' : t === 'addresses' ? '📍 Addresses' : '♡ Wishlist'}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-semibold text-gray-600">No orders yet</p>
              <Link href="/search" className="mt-4 inline-block text-sm text-orange-500 font-semibold hover:underline">Start Shopping →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: Order) => (
                <Link key={order.id} href={`/orders/${order.orderNumber}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm text-orange-600">{order.orderNumber} →</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold">₦{parseFloat(order.total).toLocaleString()}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: STATUS_STYLE[order.status]?.bg || '#f3f4f6', color: STATUS_STYLE[order.status]?.color || '#374151' }}>{order.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{item.productName}</span>
                        <span className="text-xs text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && <span className="text-xs text-gray-400 self-center">+{order.items.length - 3} more</span>}
                  </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
          <h2 className="font-bold text-sm text-gray-700 mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            {[['First Name', user.firstName], ['Last Name', user.lastName], ['Email', user.email], ['Phone', (user as any).phone || '—'], ['Account Type', user.role]].map(([label, value]) => (
              <div key={label} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 w-32 shrink-0">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link href="/forgot-password" className="text-sm text-orange-500 font-semibold hover:underline">Change Password →</Link>
          </div>
        </div>
      )}

      {/* Addresses */}
      {tab === 'addresses' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-gray-700">Saved Delivery Addresses</h2>
          </div>
          {!addressesData?.length ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📍</div>
              <p className="font-semibold text-gray-600">No saved addresses</p>
              <p className="text-sm mt-1">Your addresses will be saved at checkout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addressesData.map((addr: any) => (
                <div key={addr.id} className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{addr.firstName} {addr.lastName}</p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    <p className="text-sm text-gray-500">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.state}</p>
                    {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!addr.isDefault && (
                      <button onClick={async () => { await api.put('/addresses', { id: addr.id, ...addr, isDefault: true }); refetchAddresses() }}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100">
                        Set Default
                      </button>
                    )}
                    <button onClick={async () => { if (confirm('Delete this address?')) { await api.delete('/addresses', { data: { id: addr.id } }); refetchAddresses() } }}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wishlist */}
      {tab === 'wishlist' && (
        <div>
          {!wishlistData?.length ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">♡</div>
              <p className="font-semibold text-gray-600">Your wishlist is empty</p>
              <p className="text-sm mt-1">Save products by clicking the heart icon on any product.</p>
              <Link href="/search" className="mt-4 inline-block text-sm text-orange-500 font-semibold hover:underline">Browse Products →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistData.map((item: any) => {
                const p = item.product
                if (!p) return null
                const price = parseFloat(p.price)
                const compare = p.comparePrice ? parseFloat(p.comparePrice) : null
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/products/${p.slug}`}>
                      <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                        {p.images?.[0]?.url
                          ? <Image src={p.images[0].url} alt={p.name} fill className="object-cover hover:scale-105 transition-transform" sizes="(max-width:640px) 50vw, 200px" />
                          : <span className="text-4xl">📦</span>}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/products/${p.slug}`}><p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 hover:text-orange-600">{p.name}</p></Link>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="font-extrabold text-orange-600 text-sm">₦{price.toLocaleString()}</span>
                        {compare && <span className="text-xs text-gray-400 line-through">₦{compare.toLocaleString()}</span>}
                      </div>
                      <p className="text-xs text-gray-400">{p.vendor?.businessName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-4xl animate-pulse">👤</div></div>}>
      <AccountContent />
    </Suspense>
  )
}
