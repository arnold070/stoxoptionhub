'use client'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/apiClient'
import type { Order, Vendor, AdminAnalytics } from '@/types'
import Link from 'next/link'

function StatCard({ icon, label, value, change, color = '#f68b1f' }: {
  icon: string; label: string; value: string | number; change?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start hover:-translate-y-0.5 transition-transform">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color + '22' }}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
        <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        {change && <div className="text-xs text-green-600 font-medium mt-0.5">{change}</div>}
      </div>
    </div>
  )
}

function ActionCard({ title, count, desc, href, color }: {
  title: string; count: number; desc: string; href: string; color: string
}) {
  return (
    <Link href={href} className="block p-4 rounded-xl border-l-4 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: color + '18', borderColor: color }}>
      <div className="font-bold text-sm text-gray-900">{count} {title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </Link>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn:  () => api.get('/admin/analytics').then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const fmt = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n.toLocaleString()}`

  return (
    <div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time marketplace performance</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon="💰" label="Total Revenue"   value={fmt(data?.revenue?.total || 0)}    change={data?.revenue?.growth ? `↑ ${data.revenue.growth}% vs last month` : undefined} />
              <StatCard icon="🏪" label="Active Vendors"  value={data?.vendors?.active || 0}          change={`${data?.vendors?.pending || 0} pending approval`} color="#1e8a44" />
              <StatCard icon="📦" label="Total Orders"    value={(data?.orders?.total || 0).toLocaleString()} change={`${data?.orders?.thisMonth || 0} this month`} color="#1976d2" />
              <StatCard icon="🛍️" label="Live Products"   value={(data?.products?.live || 0).toLocaleString()}  change={`${data?.products?.pending || 0} pending review`} color="#7c3aed" />
              <StatCard icon="💸" label="This Month"      value={fmt(data?.revenue?.thisMonth || 0)}  color="#f68b1f" />
              <StatCard icon="⏳" label="Vendor Approvals" value={data?.vendors?.pending || 0} color="#f59e0b" />
              <StatCard icon="✅" label="Products Pending" value={data?.products?.pending || 0} color="#f59e0b" />
              <StatCard icon="💰" label="Commission Held"  value={fmt(data?.commissions?.pending || 0)} color="#e53935" />
            </div>

            {/* Action required */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <h2 className="text-sm font-bold text-gray-700 mb-3">⚡ Action Required</h2>
                <div className="space-y-2">
                  <ActionCard title="Vendor Applications" count={data?.vendors?.pending || 0} desc="Awaiting review and approval" href="/admin/vendors?status=pending" color="#f59e0b" />
                  <ActionCard title="Products Pending"    count={data?.products?.pending || 0} desc="Vendors waiting for approval"  href="/admin/products?status=pending"  color="#f68b1f" />
                  <ActionCard title="Payout Requests"     count={data?.payoutRequests || 0}      desc="Vendors awaiting payment"      href="/admin/payouts?status=pending"   color="#e53935" />
                </div>
              </div>

              {/* Recent orders */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
                  <Link href="/admin/orders" className="text-xs font-semibold" style={{ color: '#f68b1f' }}>View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {(data?.recentOrders as Order[] || []).slice(0, 5).map((o: import('@/types').Order) => (
                    <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-semibold">{o.orderNumber}</span>
                        <span className="text-gray-400 ml-2 text-xs">{o.user?.firstName} {o.user?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">₦{parseFloat(o.total).toLocaleString()}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: o.status === 'delivered' ? '#dcfce7' : '#fef3c7', color: o.status === 'delivered' ? '#15803d' : '#92400e' }}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!data?.recentOrders?.length && (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Top vendors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800">🏆 Top Vendors This Month</h2>
                <Link href="/admin/vendors" className="text-xs font-semibold" style={{ color: '#f68b1f' }}>View all →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">#</th>
                    <th className="px-5 py-3 text-left">Vendor</th>
                    <th className="px-5 py-3 text-left">Total Sales</th>
                    <th className="px-5 py-3 text-left">Orders</th>
                    <th className="px-5 py-3 text-left">Rating</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data?.topVendors as Vendor[] || []).map((v: import('@/types').Vendor, i: number) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-bold text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-semibold">{v.businessName}</td>
                        <td className="px-5 py-3 text-sm font-bold" style={{ color: '#d4720e' }}>₦{parseFloat(v.totalSales).toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm">{v.totalOrders}</td>
                        <td className="px-5 py-3 text-sm">⭐ {v.averageRating}</td>
                      </tr>
                    ))}
                    {!data?.topVendors?.length && (
                      <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-400 text-sm">No vendor data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
