'use client'
import type { AdminAnalytics } from '@/types'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import Link from 'next/link'

function Bar({ value, max, color = '#f68b1f' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-24 flex items-end">
      <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${max > 0 ? (value / max) * 100 : 0}%`, background: color, minHeight: 4 }} />
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const fmt = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n.toLocaleString()}`

  const growth = data?.revenue?.growth

  const chartData = (data?.dailyRevenue || []).slice(-14)
  const maxVal = Math.max(...chartData.map((d: any) => d.revenue), 1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time marketplace performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="text-sm text-orange-500 font-semibold hover:underline">↻ Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '💰', label: 'Total Revenue', value: fmt(data?.revenue?.total || 0), sub: `${growth ? `↑ ${growth}% vs last month` : 'All time'}`, color: '#f68b1f' },
          { icon: '🏪', label: 'Active Vendors', value: (data?.vendors?.active || 0).toLocaleString(), sub: `${data?.vendors?.pending || 0} pending approval`, color: '#1e8a44' },
          { icon: '📦', label: 'Total Orders', value: (data?.orders?.total || 0).toLocaleString(), sub: `${data?.orders?.thisMonth || 0} this month`, color: '#1976d2' },
          { icon: '🛍️', label: 'Live Products', value: (data?.products?.live || 0).toLocaleString(), sub: `${data?.products?.pending || 0} pending review`, color: '#7c3aed' },
          { icon: '💵', label: 'This Month', value: fmt(data?.revenue?.thisMonth || 0), sub: 'Revenue', color: '#f68b1f' },
          { icon: '💸', label: 'Commission Held', value: fmt(data?.commissions?.pending || 0), sub: 'Awaiting payout', color: '#e53935' },
          { icon: '⏳', label: 'Vendor Approvals', value: data?.vendors?.pending || 0, sub: 'Need review', color: '#f59e0b' },
          { icon: '📋', label: 'Product Approvals', value: data?.products?.pending || 0, sub: 'Need review', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex gap-3 items-start hover:-translate-y-0.5 transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.color + '22' }}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-xl font-extrabold text-gray-900">{isLoading ? '…' : s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-4">Revenue — Last 7 Days</h2>
          {chartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-32 mb-2">
                {chartData.map((d: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full rounded-t-lg transition-all duration-500"
                      style={{ height: `${(d.revenue / maxVal) * 100}%`, background: '#f68b1f', minHeight: 4 }} />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      ₦{(d.revenue/1000).toFixed(0)}k
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 overflow-hidden">
                {chartData.map((d: any, i: number) => (
                  <span key={i} className="truncate text-center" style={{maxWidth:`${100/chartData.length}%`}}>{d.date}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top vendors */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-4">🏆 Top Vendors This Month</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
          ) : (data?.topVendors || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No vendor data yet</p>
          ) : (
            <div className="space-y-3">
              {(data?.topVendors || []).map((v: any, i: number) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{v.businessName}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(v.totalSales) / parseFloat(data.topVendors[0].totalSales)) * 100)}%`, background: '#f68b1f' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#d4720e' }}>₦{parseFloat(v.totalSales).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-sm text-gray-800">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-orange-500 hover:underline">View All →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {isLoading ? [...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-gray-50 m-3 rounded-lg"/>) :
          (data?.recentOrders || []).map((o: any) => (
            <div key={o.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">{o.orderNumber}</span>
                <span className="text-xs text-gray-400 ml-2">{o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">₦{parseFloat(o.total).toLocaleString()}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: o.status === 'delivered' ? '#dcfce7' : '#fef3c7', color: o.status === 'delivered' ? '#15803d' : '#92400e' }}>{o.status}</span>
              </div>
            </div>
          ))}
          {!isLoading && (data?.recentOrders || []).length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
