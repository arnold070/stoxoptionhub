'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function VendorInventoryPage() {
  const qc = useQueryClient()
  const [updates, setUpdates] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-inventory'],
    queryFn: () => api.get('/vendor/products?limit=100').then(r => r.data),
  })

  const products = (data?.data || []).filter((p: any) => p.status === 'approved')

  const updateStock = async (productId: string) => {
    const newStock = updates[productId]
    if (newStock === undefined) return
    setSaving(productId)
    try {
      await api.put(`/vendor/products/${productId}`, { stock: newStock })
      toast.success('Stock updated')
      qc.invalidateQueries({ queryKey: ['vendor-inventory'] })
      setUpdates(prev => { const n = { ...prev }; delete n[productId]; return n })
    } catch { toast.error('Failed to update') }
    finally { setSaving(null) }
  }

  const outOfStock = products.filter((p: any) => p.stock === 0)
  const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 5)
  const inStock = products.filter((p: any) => p.stock > 5)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-extrabold text-gray-900">Inventory Manager</h1>
          </div>
          <p className="text-sm text-gray-400">{products.length} approved products</p>
        </div>
        <Link href="/vendor/dashboard/products/new" className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>+ Add Product</Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'In Stock', count: inStock.length, color: '#1e8a44', bg: '#e8f7ef', icon: '✅' },
          { label: 'Low Stock (≤5)', count: lowStock.length, color: '#92400e', bg: '#fef3c7', icon: '⚠️' },
          { label: 'Out of Stock', count: outOfStock.length, color: '#991b1b', bg: '#fee2e2', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: s.bg }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl h-14 animate-pulse border border-gray-100"/>)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-semibold text-gray-600">No approved products yet</p>
          <Link href="/vendor/dashboard/products/new" className="mt-3 inline-block text-sm text-orange-500 font-semibold hover:underline">Add your first product →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">SKU</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Current Stock</th>
                  <th className="px-5 py-3 text-left">Alert At</th>
                  <th className="px-5 py-3 text-left">Update Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p: any) => {
                  const stockVal = p.stock
                  const stockColor = stockVal === 0 ? '#e53935' : stockVal <= 5 ? '#f59e0b' : '#1e8a44'
                  const pending = updates[p.id]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-base shrink-0 overflow-hidden">
                            {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="40px" /> : '📦'}
                          </div>
                          <span className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">{p.sku || '—'}</td>
                      <td className="px-5 py-3 text-sm font-bold">₦{parseFloat(p.price).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-extrabold" style={{ color: stockColor }}>{stockVal}</span>
                        {stockVal === 0 && <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">OOS</span>}
                        {stockVal > 0 && stockVal <= 5 && <span className="ml-2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">LOW</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{p.lowStockAlert || 5}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={stockVal}
                            onChange={e => setUpdates(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                            className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-center focus:outline-none focus:border-orange-400"
                          />
                          {pending !== undefined && pending !== stockVal && (
                            <button
                              onClick={() => updateStock(p.id)}
                              disabled={saving === p.id}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold text-white disabled:opacity-50"
                              style={{ background: '#f68b1f' }}
                            >
                              {saving === p.id ? '…' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
