'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Category } from '@/types'

const ICONS: Record<string, string> = {
  'phones-tablets': '📱', 'computing': '💻', 'electronics': '📺', 'fashion': '👗',
  'home-kitchen': '🏠', 'beauty-health': '💄', 'baby-products': '👶',
  'sports-outdoors': '⚽', 'groceries': '🛒', 'automotive': '🚗', 'gaming': '🎮', 'books-education': '📚',
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data.data),
  })

  const { register, handleSubmit, reset } = useForm<any>({ defaultValues: { isActive: true, displayOrder: 0 } })

  const save = useMutation({
    mutationFn: (data: any) => editing
      ? api.put('/admin/categories', { id: editing.id, ...data })
      : api.post('/admin/categories', data),
    onSuccess: () => {
      toast.success(editing ? 'Category updated' : 'Category created')
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      setEditing(null); setShowForm(false); reset({ isActive: true, displayOrder: 0 })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete('/admin/categories', { data: { id } }),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['admin-categories'] }) },
  })

  const openEdit = (c: Category) => {
    setEditing(c); setShowForm(true)
    reset({ name: c.name, description: c.description || '', displayOrder: c.displayOrder, isActive: c.isActive, metaTitle: c.metaTitle || '', metaDescription: c.metaDescription || '' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories?.length || 0} categories</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditing(null); reset({ isActive: true, displayOrder: 0 }); setShowForm(true) }}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#f68b1f' }}>
            + New Category
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-5">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit(d => save.mutate(d))}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Name *</label><input {...register('name', { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Display Order</label><input type="number" {...register('displayOrder', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label><input {...register('description')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Meta Title <span className="text-gray-400">(SEO)</span></label><input {...register('metaTitle')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Meta Description <span className="text-gray-400">(SEO)</span></label><input {...register('metaDescription')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-orange-500" />
                Active (visible on storefront)
              </label>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={save.isPending} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
                  {save.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Slug</th>
                <th className="px-5 py-3 text-left">Products</th>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {(categories || []).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ICONS[c.slug] || '📦'}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                          {c.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 font-mono">{c.slug}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{c._count?.products || 0}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{c.displayOrder}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(c)} className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-orange-50 text-orange-700 hover:bg-orange-100">Edit</button>
                        <button onClick={() => { if (confirm(`Delete "${c.name}"? Products in this category will be unassigned.`)) deleteCategory.mutate(c.id) }}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
