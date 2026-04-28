'use client'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2).max(255).optional(),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().or(z.literal(0)).transform(v => v || undefined),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  tags: z.string().optional(),
  resubmit: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const { data: product, isLoading } = useQuery({
    queryKey: ['vendor-product', params.id],
    queryFn: () => api.get(`/vendor/products/${params.id}`).then(r => r.data.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/storefront/categories?limit=20').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: parseFloat(product.price),
        comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : undefined,
        stock: product.stock,
        lowStockAlert: product.lowStockAlert,
        categoryId: product.categoryId || '',
        brand: product.brand || '',
        tags: product.tags?.join(', ') || '',
      })
      setImageUrls(product.images?.map((i: any) => i.url) || [])
    }
  }, [product, reset])

  const save = useMutation({
    mutationFn: (data: FormData & { resubmit?: boolean }) => {
      const tags = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined
      const images = imageUrls.map((url, i) => ({ url, isPrimary: i === 0 }))
      return api.put(`/vendor/products/${params.id}`, { ...data, tags, images })
    },
    onSuccess: () => {
      toast.success('Product updated!')
      qc.invalidateQueries({ queryKey: ['vendor-products'] })
      router.push('/vendor/dashboard/products')
    },
  })

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'products')
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImageUrls(prev => [...prev, res.data.data.url])
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-center"><div className="text-4xl animate-pulse">⏳</div></div>

  const isRejected = product?.status === 'rejected'
  const isApproved = product?.status === 'approved'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/dashboard/products" className="text-sm text-gray-400 hover:text-gray-600">← My Products</Link>
        <h1 className="text-xl font-extrabold text-gray-900">Edit Product</h1>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-auto ${product?.status === 'approved' ? 'bg-green-100 text-green-700' : product?.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{product?.status}</span>
      </div>

      {isRejected && product?.adminNote && (
        <div className="mb-5 p-4 rounded-xl text-sm flex gap-3" style={{ background: '#fef2f2', borderLeft: '4px solid #e53935' }}>
          <span>❌</span>
          <div><strong>Admin note:</strong> {product.adminNote}<br/><span className="text-gray-500 text-xs mt-1 block">Edit the product and click "Save & Resubmit" to send for re-review.</span></div>
        </div>
      )}

      {isApproved && (
        <div className="mb-5 p-4 rounded-xl text-sm flex gap-3" style={{ background: '#e8f7ef', borderLeft: '4px solid #1e8a44' }}>
          <span>✅</span>
          <span>This product is <strong>live</strong>. You can update stock and price directly. Other changes will require re-approval.</span>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => save.mutate(data))}>
        <div className="space-y-5">
          <div className={`bg-white rounded-2xl border p-6 space-y-4 ${isApproved ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-700">Product Details</h2>
              {isApproved && <span className="text-xs text-gray-400 font-medium">🔒 Locked — contact admin to change</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Product Name</label>
              <input {...register('name')} disabled={isApproved} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Short Description</label>
              <input {...register('shortDescription')} disabled={isApproved} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
              <textarea {...register('description')} disabled={isApproved} rows={4} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Category</label>
                <select {...register('categoryId')} disabled={isApproved} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-50 disabled:cursor-not-allowed">
                  <option value="">— Select —</option>
                  {(categoriesData || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Brand</label>
                <input {...register('brand')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Tags (comma-separated)</label>
              <input {...register('tags')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-sm text-gray-700">Pricing & Stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Price (₦)</label>
                <input type="number" {...register('price', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Compare Price</label>
                <input type="number" {...register('comparePrice', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Stock Qty</label>
                <input type="number" {...register('stock', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-700 mb-3">Product Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">Main</span>}
                  <button type="button" onClick={() => setImageUrls(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
                </div>
              ))}
              {imageUrls.length < 8 && (
                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                  <span className="text-2xl text-gray-300">{uploading ? '⏳' : '+'}</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={save.isPending} className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
              {save.isPending ? 'Saving…' : isApproved ? 'Save Changes' : 'Save Draft'}
            </button>
            {isRejected && (
              <button type="button" disabled={save.isPending} onClick={handleSubmit(data => save.mutate({ ...data, resubmit: true }))}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-orange-400 text-orange-600 hover:bg-orange-50 disabled:opacity-60 transition-colors">
                Save & Resubmit for Review
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
