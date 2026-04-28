'use client'
import type { Order, Product } from '@/types'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import Link from 'next/link'

export default function VendorReportsPage() {
  const [period, setPeriod] = useState('30')

  const { data: profile } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => api.get('/vendor/profile').then(r => r.data.data),
  })

  const { data: ordersData } = useQuery({
    queryKey: ['vendor-orders-all'],
    queryFn: () => api.get('/vendor/orders?limit=100').then(r => r.data),
  })

  const orders = ordersData?.data || []
  const cutoff = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)
  const filtered = orders.filter((o: any) => new Date(o.createdAt) >= cutoff)

  const totalRevenue = filtered.reduce((s: number, o: any) => s + parseFloat(o.vendorEarning || 0), 0)
  const totalOrders = filtered.length
  const totalCommission = filtered.reduce((s: number, o: any) => s + parseFloat(o.commissionAmt || 0), 0)
  const deliveredCount = filtered.filter((o: any) => o.fulfillmentStatus === 'delivered').length

  // Group by day for chart
  const dayMap = new Map<string, number>()
  filtered.forEach((o: any) => {
    const day = new Date(o.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    dayMap.set(day, (dayMap.get(day) || 0) + parseFloat(o.vendorEarning || 0))
  })
  const chartData = Array.from(dayMap.entries()).slice(-14)
  const chartMax = Math.max(...chartData.map(([, v]) => v), 1)

  // Top products
  const productMap = new Map<string, { name: string; revenue: number; qty: number }>()
  filtered.forEach((o: any) => {
    const key = o.productId || o.productName
    const existing = productMap.get(key) || { name: o.productName, revenue: 0, qty: 0 }
    productMap.set(key, { name: o.productName, revenue: existing.revenue + parseFloat(o.vendorEarning || 0), qty: existing.qty + o.quantity })
  })
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = (type: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    if (type === 'Orders CSV') {
      downloadCsv(`orders-${dateStr}.csv`,
        ['Order #', 'Product', 'Qty', 'Unit Price', 'Earning', 'Commission', 'Status', 'Date'],
        filtered.map((o: Order) => [
          o.order?.orderNumber || '', o.productName, o.quantity,
          o.unitPrice, o.vendorEarning, o.commissionAmt,
          o.fulfillmentStatus, new Date(o.createdAt).toLocaleDateString('en-NG'),
        ])
      )
    } else if (type === 'Earnings CSV') {
      downloadCsv(`earnings-${dateStr}.csv`,
        ['Date', 'Orders', 'Revenue', 'Commission', 'Net Earnings'],
        (() => {
          const byDay = new Map<string, { orders: number; revenue: number; commission: number }>()
          filtered.forEach((o: any) => {
            const day = new Date(o.createdAt).toLocaleDateString('en-NG')
            const d = byDay.get(day) || { orders: 0, revenue: 0, commission: 0 }
            byDay.set(day, { orders: d.orders + 1, revenue: d.revenue + parseFloat(o.vendorEarning || 0), commission: d.commission + parseFloat(o.commissionAmt || 0) })
          })
          return Array.from(byDay.entries()).map(([day, d]) => [day, d.orders, d.revenue.toFixed(2), d.commission.toFixed(2), (d.revenue).toFixed(2)])
        })()
      )
    } else if (type === 'Products CSV') {
      downloadCsv(`products-${dateStr}.csv`,
        ['Product', 'Units Sold', 'Revenue', 'Avg Unit Price'],
        topProducts.map(p => [p.name, p.qty, p.revenue.toFixed(2), (p.revenue / Math.max(p.qty, 1)).toFixed(2)])
      )
    } else if (type === 'Payouts CSV') {
      downloadCsv(`payouts-${dateStr}.csv`,
        ['Period', 'Total Orders', 'Total Earnings', 'Total Commission'],
        [[ `Last ${period} days`, totalOrders, totalRevenue.toFixed(2), totalCommission.toFixed(2) ]]
      )
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profile?.businessName}</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '💰', label: 'Net Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: '#f68b1f' },
          { icon: '📦', label: 'Orders', value: totalOrders, color: '#1976d2' },
          { icon: '✅', label: 'Delivered', value: deliveredCount, color: '#1e8a44' },
          { icon: '💸', label: 'Commission Paid', value: `₦${totalCommission.toLocaleString()}`, color: '#e53935' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.color + '22' }}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-4">Revenue Over Time</h2>
          {chartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-28 mb-2">
                {chartData.map(([day, val]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm" style={{ height: `${(val / chartMax) * 100}%`, background: '#f68b1f', minHeight: 3 }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 overflow-hidden">
                {chartData.map(([day]) => <span key={day} className="truncate">{day.split(' ')[1]}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-700 mb-4">🏆 Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No sales this period</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: '#d4720e' }}>₦{p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Download reports */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm text-gray-700 mb-4">📥 Download Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Orders CSV', desc: 'All orders with details', icon: '📦' },
            { label: 'Earnings CSV', desc: 'Revenue & commissions', icon: '💰' },
            { label: 'Products CSV', desc: 'Product performance', icon: '🛍️' },
            { label: 'Payouts CSV', desc: 'Payout history', icon: '💸' },
          ].map(r => (
            <button key={r.label} onClick={() => handleDownload(r.label)} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-left hover:border-orange-200 hover:bg-orange-50 transition-colors">
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="text-xs font-bold text-gray-800">{r.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
