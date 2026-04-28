'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Product } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved: { bg: '#dcfce7', color: '#15803d' },
  pending: { bg: '#fef3c7', color: '#92400e' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  draft: { bg: '#f3f4f6', color: '#374151' },
  suspended: { bg: '#fee2e2', color: '#991b1b' },
}

export default function VendorProductsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products', page, status, q],
    queryFn: () => api.get(`/vendor/products?page=${page}&limit=20${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`).then(r => r.data),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/vendor/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-products'] }); toast.success('Product deleted') },
  })

  const products = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination?.total || 0} total products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/vendor/dashboard/products/new" className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>+ Add Product</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search products…" className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 w-56" />
        <div className="flex gap-2">
          {[['', 'All'], ['approved', 'Live'], ['pending', 'Pending'], ['rejected', 'Rejected'], ['draft', 'Draft']].map(([val, label]) => (
            <button key={val} onClick={() => { setStatus(val); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${status === val ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}
              style={status === val ? { background: '#f68b1f' } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-gray-100" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="font-semibold text-gray-600 mb-2">No products yet</p>
          <Link href="/vendor/dashboard/products/new" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>Add Your First Product →</Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Stock</th>
                  <th className="px-5 py-3 text-left">Sales</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p: import('@/types').Product) => {
                    const s = STATUS_STYLE[p.status] || { bg: '#f3f4f6', color: '#374151' }
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-lg shrink-0">
                              {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="40px" /> : '📦'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{p.name}</p>
                              {p.adminNote && p.status === 'rejected' && <p className="text-xs text-red-500 mt-0.5 max-w-[180px] truncate">Note: {p.adminNote}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{p.category?.name || '—'}</td>
                        <td className="px-5 py-4 text-sm font-bold">₦{parseFloat(p.price).toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: p.stock === 0 ? '#e53935' : p.stock < 5 ? '#f59e0b' : '#1e8a44', fontWeight: '600' }}>{p.stock}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{p._count?.orderItems || 0} sold</td>
                        <td className="px-5 py-4"><span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{p.status}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            <Link href={`/vendor/dashboard/products/${p.id}/edit`} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">Edit</Link>
                            {p.status === 'rejected' && (
                              <Link href={`/vendor/dashboard/products/${p.id}/edit`} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Resubmit</Link>
                            )}
                            <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p.id) }} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-orange-400">Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
