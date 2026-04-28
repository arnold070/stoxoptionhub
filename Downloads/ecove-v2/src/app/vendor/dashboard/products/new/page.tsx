'use client'
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Required').max(255),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Enter a valid price' }).positive(),
  comparePrice: z.number().positive().optional().or(z.literal(0)).or(z.literal('')).transform(v => v || undefined),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  brand: z.string().max(100).optional(),
  sku: z.string().max(100).optional(),
  weight: z.number().positive().optional().or(z.literal('')).transform(v => v || undefined),
  handlingTime: z.string().optional(),
  shipsFrom: z.string().optional(),
  tags: z.string().optional(),
  variants: z.array(z.object({
    name: z.string().min(1),
    value: z.string().min(1),
    stock: z.number().int().min(0),
    priceAdjustment: z.number().optional(),
  })).optional(),
})
type FormData = z.infer<typeof schema>

export default function AddProductPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/storefront/categories?limit=20').then(r => r.data.data),
  })

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0, variants: [] },
  })

  const { fields: variantFields, append: addVariant, remove: removeVariant } = useFieldArray({
    control, name: 'variants',
  })

  const price = watch('price') || 0
  const commissionEst = (price * 0.08).toFixed(0)
  const earning = (price * 0.92).toFixed(0)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files.slice(0, 8 - imageUrls.length)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'products')
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        urls.push(res.data.data.url)
      }
      setImageUrls(prev => [...prev, ...urls])
      toast.success(`${urls.length} image(s) uploaded`)
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const onSubmit = async (data: FormData) => {
    if (imageUrls.length === 0) { toast.error('Please upload at least one product image'); return }
    setSubmitting(true)
    try {
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const payload = {
        ...data,
        tags,
        images: imageUrls.map((url, i) => ({ url, isPrimary: i === 0 })),
        variants: data.variants?.filter(v => v.name && v.value),
      }
      await api.post('/vendor/products', payload)
      toast.success('Product submitted for admin review!')
      router.push('/vendor/dashboard')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-xl font-extrabold text-gray-900">Add New Product</h1>
      </div>

      {/* Notice */}
      <div className="mb-6 p-4 rounded-xl text-sm flex gap-3" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
        <span>⏳</span>
        <span><strong>Products require admin approval</strong> before going live. You'll be notified by email once reviewed (usually within 24 hours).</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-sm text-gray-700 mb-4">Product Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Product Name <span className="text-red-400">*</span></label>
                  <input {...register('name')} placeholder="e.g. Samsung Galaxy A55 5G 256GB Space Navy" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Category</label>
                  <select {...register('categoryId')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                    <option value="">— Select Category —</option>
                    {(categoriesData || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Short Description <span className="text-gray-400">(shown in search)</span></label>
                  <input {...register('shortDescription')} maxLength={160} placeholder="One-line summary, max 160 chars" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Full Description</label>
                  <textarea {...register('description')} rows={5} placeholder="Detailed product description, key features, what's in the box…" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Brand</label>
                    <input {...register('brand')} placeholder="Samsung, Nike, etc." className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">SKU</label>
                    <input {...register('sku')} placeholder="SAM-A55-BLK" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Tags <span className="text-gray-400">(comma-separated)</span></label>
                  <input {...register('tags')} placeholder="samsung, galaxy, android, 5g" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-sm text-gray-700 mb-4">Pricing & Stock</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Selling Price (₦) <span className="text-red-400">*</span></label>
                  <input type="number" {...register('price', { valueAsNumber: true })} placeholder="285000" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Compare-at Price (₦)</label>
                  <input type="number" {...register('comparePrice', { valueAsNumber: true })} placeholder="320000 (crossed out)" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              {price > 0 && (
                <div className="p-3 rounded-xl text-xs mb-4" style={{ background: '#e8f7ef' }}>
                  <strong>Commission breakdown:</strong> Price ₦{Number(price).toLocaleString()} → Commission (8%) ₦{Number(commissionEst).toLocaleString()} → <strong className="text-green-700">You earn ₦{Number(earning).toLocaleString()}</strong>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Stock Qty <span className="text-red-400">*</span></label>
                  <input type="number" {...register('stock', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Low Stock Alert</label>
                  <input type="number" {...register('lowStockAlert', { valueAsNumber: true })} placeholder="5" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Weight (kg)</label>
                  <input type="number" step="0.1" {...register('weight', { valueAsNumber: true })} placeholder="0.5" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-gray-700">Variants <span className="text-gray-400 font-normal">(optional)</span></h2>
                <button type="button" onClick={() => addVariant({ name: '', value: '', stock: 0 })} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: '#f68b1f' }}>+ Add Variant</button>
              </div>
              <div className="space-y-3">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl">
                    <input {...register(`variants.${index}.name`)} placeholder="Type (e.g. Color)" className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                    <input {...register(`variants.${index}.value`)} placeholder="Value (e.g. Black)" className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                    <input type="number" {...register(`variants.${index}.stock`, { valueAsNumber: true })} placeholder="Stock" className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                    <button type="button" onClick={() => removeVariant(index)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
                {variantFields.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No variants added. Add variants for different sizes, colours, etc.</p>}
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-sm text-gray-700 mb-4">Shipping</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Handling Time</label>
                  <select {...register('handlingTime')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                    <option value="1-2 business days">1–2 business days</option>
                    <option value="Same day">Same day</option>
                    <option value="2-3 business days">2–3 business days</option>
                    <option value="3-5 business days">3–5 business days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Ships From</label>
                  <input {...register('shipsFrom')} placeholder="Lagos, Nigeria" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Images */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-sm text-gray-700 mb-3">Product Images <span className="text-red-400">*</span></h2>
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="text-3xl mb-1">{uploading ? '⏳' : '📷'}</div>
                <p className="text-xs font-semibold text-gray-600">{uploading ? 'Uploading…' : 'Click to upload images'}</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max 5MB · Up to 8 images</p>
              </label>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-white text-[9px] py-0.5">Main</span>}
                      <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission checklist */}
            <div className="bg-white rounded-2xl border-2 border-yellow-200 p-5" style={{ background: '#fef9e7' }}>
              <h3 className="font-bold text-sm mb-3 text-yellow-800">Before Submitting</h3>
              <ul className="text-xs text-yellow-700 space-y-1.5">
                {['Accurate product name and description','At least 1 clear product image','Correct category selected','Realistic price (no inflation)','Stock count is accurate','No prohibited or counterfeit items'].map(item => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-60" style={{ background: '#f68b1f' }}>
              {submitting ? 'Submitting…' : 'Submit for Review →'}
            </button>
            <button type="button" onClick={() => router.back()} className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
