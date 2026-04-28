'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function VendorProfilePage() {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => api.get('/vendor/profile').then(r => r.data.data),
  })

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    values: vendor ? {
      businessName: vendor.businessName || '',
      tagline: vendor.tagline || '',
      description: vendor.description || '',
      phone: vendor.phone || '',
      whatsapp: vendor.whatsapp || '',
      city: vendor.city || '',
      state: vendor.state || '',
      address: vendor.address || '',
      bankName: vendor.bankName || '',
      bankAccountNumber: vendor.bankAccountNumber || '',
      bankAccountName: vendor.bankAccountName || '',
    } : undefined,
  })

  const save = useMutation({
    mutationFn: (data: any) => api.put('/vendor/profile', data),
    onSuccess: () => { toast.success('Profile updated!'); qc.invalidateQueries({ queryKey: ['vendor-profile'] }) },
  })

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, field: 'vendor-logo' | 'vendor-banner') => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', field)
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.put('/vendor/profile', field === 'vendor-logo' ? { logoUrl: res.data.data.url } : { bannerUrl: res.data.data.url })
      toast.success(`${field === 'vendor-logo' ? 'Logo' : 'Banner'} updated!`)
      qc.invalidateQueries({ queryKey: ['vendor-profile'] })
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-center"><div className="text-4xl animate-pulse">⏳</div></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">Profile & Settings</h1>
      </div>

      {/* Store visuals */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="h-28 relative" style={{ background: vendor?.bannerUrl ? `url(${vendor.bannerUrl}) center/cover` : 'linear-gradient(135deg, #d4720e, #f68b1f)' }}>
          <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
            <input type="file" accept="image/*" onChange={e => uploadLogo(e, 'vendor-banner')} className="hidden" />
            {uploading ? '⏳ Uploading…' : '📷 Change Banner'}
          </label>
        </div>
        <div className="px-5 pb-5 pt-2 flex items-end gap-4 -mt-8">
          <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow flex items-center justify-center text-2xl shrink-0 overflow-hidden relative group cursor-pointer">
            {vendor?.logoUrl ? <Image src={vendor.logoUrl} alt="" fill className="object-cover rounded-full" sizes="64px" /> : <span>{vendor?.businessName?.[0] || '🏪'}</span>}
            <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold">
              <input type="file" accept="image/*" onChange={e => uploadLogo(e, 'vendor-logo')} className="hidden" />Edit
            </label>
          </div>
          <div>
            <p className="font-extrabold text-gray-900">{vendor?.businessName}</p>
            <a href={`/store/${vendor?.slug}`} target="_blank" className="text-xs text-orange-500 hover:underline">ecove.com.ng/store/{vendor?.slug} →</a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => save.mutate(d))}>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-sm text-gray-700">Business Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Business Name</label><input {...register('businessName')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Tagline</label><input {...register('tagline')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label><textarea {...register('description')} rows={3} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none"/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Phone</label><input type="tel" {...register('phone')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">WhatsApp</label><input type="tel" {...register('whatsapp')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">City</label><input {...register('city')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">State</label><input {...register('state')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Business Address</label><input {...register('address')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-sm text-gray-700">🏦 Bank Details for Payouts</h2>
            <div className="p-3 rounded-xl text-xs" style={{ background: '#e8f7ef', color: '#166b34' }}>
              ✅ Bank details are encrypted and only used for payout transfers.
            </div>
            <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Bank Name</label>
              <select {...register('bankName')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                <option value="">— Select Bank —</option>
                {['First Bank of Nigeria','GTBank','Zenith Bank','Access Bank','UBA','Fidelity Bank','Opay','Palmpay','Kuda Bank','FCMB','Sterling Bank'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Account Number</label><input {...register('bankAccountNumber')} maxLength={10} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Account Name</label><input {...register('bankAccountName')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"/></div>
            </div>
          </div>

          <button type="submit" disabled={save.isPending} className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
            {save.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
