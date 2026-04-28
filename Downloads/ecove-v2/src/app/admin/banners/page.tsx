'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Banner } from '@/types'

const POSITIONS = [
  { value: 'hero_slider', label: 'Hero Slider' },
  { value: 'side_card_left', label: 'Side Card Left' },
  { value: 'side_card_right', label: 'Side Card Right' },
  { value: 'full_width', label: 'Full Width' },
  { value: 'dual_banner', label: 'Dual Banner' },
]

export default function AdminBannersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Banner | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: banners, isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/admin/banners').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: { isActive: true, displayOrder: 0 },
  })

  const save = useMutation({
    mutationFn: (data: any) => editing ? api.put('/admin/banners', { id: editing.id, ...data }) : api.post('/admin/banners', data),
    onSuccess: () => {
      toast.success(editing ? 'Banner updated' : 'Banner created')
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      setEditing(null); setShowForm(false); reset()
    },
  })

  const deleteBanner = useMutation({
    mutationFn: (id: string) => api.delete('/admin/banners', { data: { id } }),
    onSuccess: () => { toast.success('Banner deleted'); qc.invalidateQueries({ queryKey: ['admin-banners'] }) },
  })

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'banners')
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setValue('imageUrl', res.data.data.url)
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const openEdit = (b: Banner) => {
    setEditing(b); setShowForm(true)
    reset({ title: b.title, subtitle: b.subtitle || '', ctaText: b.ctaText || '', ctaLink: b.ctaLink || '', imageUrl: b.imageUrl || '', bgColor: b.bgColor || '', position: b.position, displayOrder: b.displayOrder, isActive: b.isActive })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Banner Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage homepage and promotional banners</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditing(null); reset({ isActive: true, displayOrder: 0 }); setShowForm(true) }}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>
            + New Banner
          </button>
        </div>
      </div>

      {/* Banner form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-5">{editing ? 'Edit Banner' : 'Create New Banner'}</h2>
          <form onSubmit={handleSubmit(d => save.mutate(d))}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Title *</label><input {...register('title', { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Subtitle</label><input {...register('subtitle')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">CTA Text</label><input {...register('ctaText')} placeholder="Shop Now" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">CTA Link</label><input {...register('ctaLink')} placeholder="/search?category=phones-tablets" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Position *</label>
                <select {...register('position', { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                  {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Display Order</label><input type="number" {...register('displayOrder', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Background Color</label><input {...register('bgColor')} placeholder="#f68b1f" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Banner Image</label>
                <div className="flex gap-2">
                  <input {...register('imageUrl')} placeholder="https://… or upload below" className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  <label className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-orange-400 text-gray-500 shrink-0">
                    {uploading ? '⏳' : '📷'}
                    <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                  </label>
                </div>
              </div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Start Date</label><input type="datetime-local" {...register('startDate')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">End Date</label><input type="datetime-local" {...register('endDate')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-orange-500" />
                Active (visible on storefront)
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); reset() }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={save.isPending} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
                  {save.isPending ? 'Saving…' : editing ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Banners list */}
      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)
        ) : !banners?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center text-gray-400">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="font-semibold text-gray-600">No banners yet. Create your first banner above.</p>
          </div>
        ) : banners.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-center">
            {b.imageUrl ? (
              <Image src={b.imageUrl} alt={b.title} width={96} height={56} className="object-cover rounded-xl border border-gray-100 shrink-0" />
            ) : (
              <div className="w-24 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ background: b.bgColor || '#f68b1f' }}>
                <span className="text-white text-xs font-bold text-center px-1">{b.title}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">{b.title}</p>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{POSITIONS.find(p => p.value === b.position)?.label}</span>
                <span className="text-xs text-gray-400">Order: {b.displayOrder}</span>
                {b.ctaLink && <span className="text-xs text-gray-400 truncate max-w-[200px]">→ {b.ctaLink}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => openEdit(b)} className="text-xs px-3 py-1.5 rounded-lg font-bold bg-orange-50 text-orange-700 hover:bg-orange-100">Edit</button>
              <button onClick={() => { if (confirm('Delete this banner?')) deleteBanner.mutate(b.id) }} className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
