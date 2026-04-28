'use client'
import type { CommissionRule } from '@/types'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import PromptModal from '@/components/PromptModal'
import Link from 'next/link'

export default function AdminCommissionsPage() {
  const qc = useQueryClient()
  const [editRates, setEditRates] = useState<Record<string, string>>({})
  const [vendorRateModal, setVendorRateModal] = useState<{ id: string; vendorId: string; currentRate: string } | null>(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => api.get('/admin/commissions').then(r => r.data.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/storefront/categories?limit=20').then(r => r.data.data),
  })

  const saveRule = useMutation({
    mutationFn: (data: any) => data.id ? api.put('/admin/commissions', data) : api.post('/admin/commissions', data),
    onSuccess: () => { toast.success('Commission rule saved'); qc.invalidateQueries({ queryKey: ['admin-commissions'] }) },
  })

  const globalRule = rules?.find((r: any) => r.type === 'global')
  const categoryRules = rules?.filter((r: any) => r.type === 'category') || []
  const vendorRules = rules?.filter((r: any) => r.type === 'vendor') || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Commission Rules</h1>
          <p className="text-sm text-gray-400 mt-0.5">Global → Category → Vendor-specific (highest priority wins)</p>
        </div>
      </div>

      {/* Global rate */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <h2 className="font-bold text-sm text-gray-700 mb-4">🌐 Global Default Rate</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-extrabold" style={{ color: '#f68b1f' }}>{globalRule?.rate || 10}%</div>
            <div className="text-xs text-gray-400 mt-1">Current global rate</div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Applied to all sales unless a category or vendor rule overrides it.</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" step="0.5"
                defaultValue={globalRule?.rate || 10}
                onChange={e => setEditRates(prev => ({ ...prev, global: e.target.value }))}
                className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl text-xl font-bold text-center focus:outline-none focus:border-orange-400"
              />
              <span className="text-xl text-gray-400 font-bold">%</span>
              <button
                onClick={() => {
                  const rate = parseFloat(editRates.global || String(globalRule?.rate || 10))
                  if (globalRule) saveRule.mutate({ id: globalRule.id, type: 'global', rate })
                  else saveRule.mutate({ type: 'global', rate })
                }}
                disabled={saveRule.isPending}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: '#f68b1f' }}>
                Update
              </button>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              Example: Product sold for <strong>₦10,000</strong> → Commission = <strong>₦{Math.round(10000 * (parseFloat(editRates.global || String(globalRule?.rate || 10)) / 100)).toLocaleString()}</strong> → Vendor receives <strong>₦{Math.round(10000 * (1 - parseFloat(editRates.global || String(globalRule?.rate || 10)) / 100)).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Category rules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-gray-700">🗂️ Category Rates</h2>
          <span className="text-xs text-gray-400">Overrides global rate for all vendors in this category</span>
        </div>
        <div className="divide-y divide-gray-50">
          {(categories || []).map((cat: any) => {
            const existing = categoryRules.find((r: any) => r.categoryId === cat.id)
            const key = `cat_${cat.id}`
            return (
              <div key={cat.id} className="py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                  <p className="text-xs text-gray-400">{existing ? `Custom: ${existing.rate}%` : `Using global rate: ${globalRule?.rate || 10}%`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="100" step="0.5"
                    defaultValue={existing?.rate ?? globalRule?.rate ?? 10}
                    onChange={e => setEditRates(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-20 px-2.5 py-2 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-orange-400"
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <button
                    onClick={() => {
                      const rate = parseFloat(editRates[key] || String(existing?.rate ?? globalRule?.rate ?? 10))
                      if (existing) saveRule.mutate({ id: existing.id, type: 'category', rate, categoryId: cat.id })
                      else saveRule.mutate({ type: 'category', rate, categoryId: cat.id })
                    }}
                    disabled={saveRule.isPending}
                    className="text-xs px-3 py-2 rounded-lg font-bold text-white disabled:opacity-50"
                    style={{ background: '#f68b1f' }}>
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Vendor-specific rules */}
      {vendorRules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-sm text-gray-700 mb-4">🏪 Vendor-Specific Rates</h2>
          <div className="divide-y divide-gray-50">
            {vendorRules.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Vendor ID: {r.vendorId}</p>
                  <p className="text-xs text-gray-400">Overrides all other rules</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold" style={{ color: '#f68b1f' }}>{r.rate}%</span>
                  <button onClick={() => setVendorRateModal({ id: r.id, vendorId: r.vendorId, currentRate: String(r.rate) })}
                    className="text-xs px-3 py-2 rounded-lg font-bold bg-orange-50 text-orange-700 hover:bg-orange-100">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
      <PromptModal
        open={!!vendorRateModal}
        title="Edit Vendor Commission Rate"
        label="New rate (%):"
        placeholder="e.g. 8.5"
        defaultValue={vendorRateModal?.currentRate || ''}
        confirmLabel="Save Rate"
        onConfirm={(val) => {
          const rate = parseFloat(val)
          if (!isNaN(rate) && vendorRateModal) {
            saveRule.mutate({ id: vendorRateModal.id, type: 'vendor', rate, vendorId: vendorRateModal.vendorId })
          }
          setVendorRateModal(null)
        }}
        onCancel={() => setVendorRateModal(null)}
      />
  )
}
