'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Coupon } from '@/types'

export default function AdminCouponsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, watch, reset } = useForm<any>({ defaultValues: { isActive: true } })
  const couponType = watch('type')

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then(r => r.data.data),
  })

  const create = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data }
      if (payload.value) payload.value = parseFloat(payload.value)
      if (payload.minOrderAmount) payload.minOrderAmount = parseFloat(payload.minOrderAmount)
      if (payload.maxUses) payload.maxUses = parseInt(payload.maxUses)
      if (editing) return api.put('/admin/coupons', { id: editing.id, ...payload })
      return api.post('/admin/coupons', payload)
    },
    onSuccess: () => { toast.success('Coupon created'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setShowForm(false); reset({ isActive: true }) },
  })

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => api.delete('/admin/coupons', { data: { id } }),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }) },
  })

  const [editing, setEditing] = useState<any>(null)
  const now = new Date()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Coupon Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{coupons?.length || 0} coupons</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>+ New Coupon</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-5">Create Coupon</h2>
          <form onSubmit={handleSubmit(d => create.mutate(d))}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Coupon Code * <span className="text-gray-400 font-normal">(auto-uppercased)</span></label>
                <input {...register('code', { required: true })} placeholder="SAVE20" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Type *</label>
                <select {...register('type', { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                  <option value="">— Select type —</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              {(couponType === 'percentage' || couponType === 'fixed') && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    {couponType === 'percentage' ? 'Discount % *' : 'Discount Amount (₦) *'}
                  </label>
                  <input type="number" step="0.01" {...register('value', { required: true })} placeholder={couponType === 'percentage' ? '20' : '5000'} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Min Order Amount (₦)</label>
                <input type="number" {...register('minOrderAmount')} placeholder="10000" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Max Uses</label>
                <input type="number" {...register('maxUses')} placeholder="100 (leave blank = unlimited)" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Start Date</label>
                <input type="datetime-local" {...register('startDate')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Expiry Date</label>
                <input type="datetime-local" {...register('endDate')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-orange-500" />
                Active immediately
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); reset({ isActive: true }) }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={create.isPending} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
                  {create.isPending ? 'Creating…' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : !coupons?.length ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">🎟️</div>
            <p className="font-semibold text-gray-600">No coupons yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Value</th>
                <th className="px-5 py-3 text-left">Min Order</th>
                <th className="px-5 py-3 text-left">Usage</th>
                <th className="px-5 py-3 text-left">Expiry</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(c => {
                  const expired = c.endDate ? new Date(c.endDate) < now : false
                  const active = c.isActive && !expired
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-mono font-bold text-sm">{c.code}</td>
                      <td className="px-5 py-4 text-sm capitalize text-gray-600">{c.type.replace('_', ' ')}</td>
                      <td className="px-5 py-4 text-sm font-bold" style={{ color: '#f68b1f' }}>
                        {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `₦${Number(c.value).toLocaleString()}` : 'Free'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.minOrderAmount ? `₦${Number(c.minOrderAmount).toLocaleString()}` : '—'}</td>
                      <td className="px-5 py-4 text-sm">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ' / ∞'}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.endDate ? new Date(c.endDate).toLocaleDateString('en-NG') : 'No expiry'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${active ? 'bg-green-100 text-green-700' : expired ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? 'Active' : expired ? 'Expired' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => {
                          setEditing(c)
                          reset({ code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount, maxUses: c.maxUses, startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0,16) : '', endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0,16) : '', isActive: c.isActive })
                        }} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => { if (confirm(`Delete coupon "${c.code}"?`)) deleteCoupon.mutate(c.id) }}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
