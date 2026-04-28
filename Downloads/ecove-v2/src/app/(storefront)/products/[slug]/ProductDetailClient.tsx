'use client'
import type { Product, ProductVariant } from '@/types'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart, useWishlist } from '@/hooks/useCart'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/apiClient'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'


function ReviewForm({ productId }: { productId: string }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = useMutation({
    mutationFn: () => api.post('/reviews', { productId, rating, title, body }),
    onSuccess: () => { setSubmitted(true); toast.success('Review submitted! It will appear after moderation.') },
  })

  if (!user) return (
    <div className="mt-6 p-4 rounded-xl bg-gray-50 text-center">
      <p className="text-sm text-gray-600">
        <a href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</a> to write a review
      </p>
    </div>
  )

  if (submitted) return (
    <div className="mt-6 p-4 rounded-xl bg-green-50 text-center">
      <p className="text-sm text-green-700 font-semibold">✅ Thanks! Your review has been submitted for moderation.</p>
    </div>
  )

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h4 className="font-bold text-sm text-gray-800 mb-4">Write a Review</h4>
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1.5">Your rating</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="text-2xl transition-colors">
              <span className={star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Review title (optional)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 mb-3" />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share your experience with this product…" rows={3}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none mb-3" />
      <button
        onClick={() => { if (rating === 0) { toast.error('Please select a star rating'); return } submit.mutate() }}
        disabled={submit.isPending || rating === 0}
        className="px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors"
        style={{ background: '#f68b1f' }}>
        {submit.isPending ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  )
}


function ProductTabs({ product }: { product: any }) {
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')
  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specs',       label: 'Specifications', hide: !product.specifications || Object.keys(product.specifications).length === 0 },
    { id: 'reviews',     label: `Reviews (${product._count?.reviews || 0})` },
  ].filter(t => !t.hide)

  return (
    <div className="relative mt-12 bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 flex gap-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            {product.description
              ? <p>{product.description}</p>
              : <p className="text-gray-400">No description provided.</p>}
          </div>
        )}
        {activeTab === 'specs' && product.specifications && (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specifications).map(([k, v]) => (
                <tr key={k} className="border-b border-gray-50">
                  <td className="py-2.5 font-semibold text-gray-700 w-1/3 pr-4">{k}</td>
                  <td className="py-2.5 text-gray-500">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {activeTab === 'reviews' && (
          <div>
            {product.reviews?.length > 0 ? (
              <>
              <div className="space-y-4 mb-6">
                {product.reviews.map((r: any) => (
                  <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="relative w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                        {r.user?.firstName?.[0] || 'G'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Anonymous'}
                          {r.isVerifiedPurchase && <span className="ml-2 text-xs text-green-600 font-normal">✓ Verified Purchase</span>}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-xs ${i <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{new Date(r.createdAt).toLocaleDateString('en-NG')}</span>
                        </div>
                      </div>
                    </div>
                    {r.title && <p className="text-sm font-semibold text-gray-700 mb-1">"{r.title}"</p>}
                    {r.body && <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>}
                  </div>
                ))}
              </div>
              <ReviewForm productId={product.id} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">⭐</div>
                <p className="font-medium text-gray-600">No reviews yet</p>
                <p className="text-sm mt-1">Be the first to review this product</p>
              </div>
            )}
            {!product.reviews?.length && <ReviewForm productId={product.id} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductDetailClient({ product, related = [] }: { product: Product; related?: Product[] }) {
  const { addItem } = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const [selectedImg, setSelectedImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  const price = parseFloat(product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.price)
  const compare = product.comparePrice ? parseFloat(product.comparePrice) : null
  const discount = compare ? Math.round((1 - price / compare) * 100) : null
  const wished = isWishlisted(product.id)

  // Group variants by name
  const variantGroups: Record<string, any[]> = {}
  product.variants?.forEach((v: any) => {
    if (!variantGroups[v.name]) variantGroups[v.name] = []
    variantGroups[v.name].push(v)
  })

  const addToCart = () => {
    const variantInfo = Object.keys(selectedVariants).length > 0
      ? { name: Object.keys(selectedVariants)[0], value: Object.values(selectedVariants)[0] }
      : undefined
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        variantId: selectedVariants && Object.keys(selectedVariants).length > 0
          ? product.variants?.find((v: any) => Object.values(selectedVariants).includes(v.value))?.id
          : undefined,
        name: product.name,
        price,
        image: product.images?.[0]?.url || '',
        slug: product.slug,
        variant: variantInfo,
      })
    }
    toast.success(`${qty}x ${product.name} added to cart`)
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-orange-500">Home</Link>
        <span>/</span>
        {product.category && <><Link href={`/categories/${product.category.slug}`} className="hover:text-orange-500">{product.category.name}</Link><span>/</span></>}
        <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
            {product.images?.[selectedImg]?.url ? (
              <Image src={product.images[selectedImg].url} alt={product.name} fill className="w-full h-full object-contain" sizes="600px" />
            ) : (
              <span className="text-8xl">📦</span>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img: { url: string }, i: number) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === selectedImg ? 'border-orange-400' : 'border-transparent'}`}>
                  <Image src={img.url} alt="" fill className="w-full h-full object-cover" sizes="200px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && <p className="text-sm text-orange-600 font-semibold mb-1">{product.brand}</p>}
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3 leading-snug">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={i <= Math.round(parseFloat(product.vendor?.averageRating || 0)) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
              ))}
            </div>
            <span className="text-sm text-gray-500">({product._count?.reviews || 0} reviews)</span>
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-extrabold text-orange-600">₦{price.toLocaleString()}</span>
            {compare && <span className="text-lg text-gray-400 line-through">₦{compare.toLocaleString()}</span>}
            {discount && <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">-{discount}%</span>}
          </div>
          {compare && <p className="text-xs text-green-600 font-semibold mb-4">You save ₦{(compare - price).toLocaleString()}</p>}

          {/* Short description */}
          {product.shortDescription && <p className="text-sm text-gray-600 mb-5 leading-relaxed">{product.shortDescription}</p>}

          {/* Variants */}
          {Object.entries(variantGroups).map(([name, variants]) => (
            <div key={name} className="mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2">{name}:</p>
              <div className="flex flex-wrap gap-2">
                {(variants as any[]).map((v: ProductVariant) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariants(prev => ({ ...prev, [name]: v.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${selectedVariants[name] === v.value ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Qty + Add to cart */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">−</button>
              <span className="w-12 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
            </div>
            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-40"
              style={{ background: '#f68b1f' }}
            >
              Add to Cart
            </button>
            <button
              onClick={() => { toggleWishlist(product.id); toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist') }}
              className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg transition-colors ${wished ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-300'}`}
            >
              {wished ? '♥' : '♡'}
            </button>
          </div>

          {/* Vendor */}
          {product.vendor && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Sold by:</p>
              <Link href={`/store/${product.vendor.slug}`} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#f68b1f' }}>
                  {product.vendor.businessName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600">{product.vendor.businessName}</p>
                  <p className="text-xs text-gray-400">⭐ {parseFloat(product.vendor.averageRating || 0).toFixed(1)} · Visit Store →</p>
                </div>
              </Link>
            </div>
          )}

          {/* Shipping info */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-2.5 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span>🚚</span> <span>Dispatched by <strong>{product.vendor?.businessName}</strong> within <strong>{product.handlingTime || '1–2 business days'}</strong></span></div>
            <div className="flex items-center gap-2"><span>🔄</span> <span>Easy returns within 7 days of delivery</span></div>
            <div className="flex items-center gap-2"><span>🔒</span> <span>Secure payment via Paystack or Flutterwave</span></div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-gray-400 font-semibold">Share:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Ecove – ₦${price.toLocaleString()}
${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-colors">
              <span>💬</span> WhatsApp
            </a>
            <button onClick={() => { navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : ''); toast.success('Link copied!') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-600 hover:text-white transition-colors">
              <span>🔗</span> Copy Link
            </button>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} – ₦${price.toLocaleString()}`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors">
              <span>𝕏</span> Tweet
            </a>
          </div>
        </div>
      </div>

      {/* Description & Specs tabs */}
      <ProductTabs product={product} />
    </div>
 
      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full inline-block" style={{ background: '#f68b1f' }} />
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.slice(0, 4).map((p: any) => {
              const price = parseFloat(p.price)
              const compare = p.comparePrice ? parseFloat(p.comparePrice) : null
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <Link href={`/products/${p.slug}`}>
                    <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {p.images?.[0]?.url
                        ? <Image src={p.images[0].url} alt={p.name} fill className="w-full h-full object-cover" sizes="200px" />
                        : <span className="text-4xl">📦</span>}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/products/${p.slug}`}><p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 hover:text-orange-600">{p.name}</p></Link>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-orange-600 text-sm">₦{price.toLocaleString()}</span>
                      {compare && <span className="text-xs text-gray-400 line-through">₦{compare.toLocaleString()}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{p.vendor?.businessName}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}