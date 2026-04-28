'use client'
import type { Product, Category } from '@/types'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import toast from 'react-hot-toast'

const CATEGORY_ICONS: Record<string, string> = { 'phones-tablets':'📱','computing':'💻','electronics':'📺','fashion':'👗','home-kitchen':'🏠','beauty-health':'💄','baby-products':'👶','sports-outdoors':'⚽','groceries':'🛒','automotive':'🚗','gaming':'🎮','books-education':'📚' }

function SearchContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const { addItem } = useCart()

  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<any[]>([])

  const q = sp.get('q') || ''
  const category = sp.get('category') || ''
  const sort = sp.get('sort') || 'newest'
  const flashSale = sp.get('flashSale') === 'true'
  const featured = sp.get('featured') === 'true'
  const bestSeller = sp.get('bestSeller') === 'true'
  const minPrice = sp.get('minPrice') || ''
  const maxPrice = sp.get('maxPrice') || ''

  const [localMin, setLocalMin] = useState(minPrice)
  const [localMax, setLocalMax] = useState(maxPrice)
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePrice = (key: 'minPrice' | 'maxPrice', val: string) => {
    if (key === 'minPrice') setLocalMin(val)
    else setLocalMax(val)
    if (priceTimer.current) clearTimeout(priceTimer.current)
    priceTimer.current = setTimeout(() => {
      updateParam(key, val)
    }, 600)
  }

  const limit = 24

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (flashSale) params.set('flashSale', 'true')
    if (featured) params.set('featured', 'true')
    if (bestSeller) params.set('bestSeller', 'true')
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    params.set('page', String(page))
    params.set('limit', String(limit))

    setLoading(true)
    fetch(`/api/storefront/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.data || []); setTotal(d.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [q, category, sort, flashSale, featured, bestSeller, minPrice, maxPrice, page])

  // Sync local price state with URL params (handles browser back/forward)
  useEffect(() => { setLocalMin(minPrice); setLocalMax(maxPrice) }, [minPrice, maxPrice])

  useEffect(() => {
    fetch('/api/storefront/categories?limit=20')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
  }, [])

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    router.push(`/search?${p}`)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)
  const heading = q ? `Search results for "${q}"` : flashSale ? '⚡ Flash Sales' : featured ? '⭐ Featured Products' : bestSeller ? '🏆 Best Sellers' : category ? categories.find(c => c.slug === category)?.name || 'Products' : 'All Products'

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            <h3 className="font-bold text-sm mb-3">Categories</h3>
            <div className="space-y-1">
              <button onClick={() => updateParam('category', '')} className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!category ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}>All</button>
              {categories.map((cat: Category) => (
                <button key={cat.id} onClick={() => updateParam('category', cat.slug)} className={`flex items-center gap-2 w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${category === cat.slug ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}>
                  <span>{CATEGORY_ICONS[cat.slug]}</span>{cat.name}
                </button>
              ))}
            </div>

            <hr className="my-4" />
            <h3 className="font-bold text-sm mb-3">Price Range</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min ₦" value={localMin} onChange={e => updatePrice('minPrice', e.target.value)} className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-orange-400" />
              <input type="number" placeholder="Max ₦" value={localMax} onChange={e => updatePrice('maxPrice', e.target.value)} className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-orange-400" />
            </div>

            <hr className="my-4" />
            <h3 className="font-bold text-sm mb-3">Filter</h3>
            {[['Flash Sale', 'flashSale', flashSale], ['Featured', 'featured', featured], ['Best Sellers', 'bestSeller', bestSeller]].map(([label, key, active]) => (
              <button key={key as string} onClick={() => updateParam(key as string, active ? '' : 'true')} className={`flex items-center gap-2 w-full text-left text-sm px-2 py-1.5 rounded-lg mb-1 transition-colors ${active ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${active ? 'bg-orange-400 border-orange-400 text-white' : 'border-gray-300'}`}>{active && '✓'}</span>
                {label as string}
              </button>
            ))}
          </div>
        </aside>

        {/* Results */}
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{heading}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} product{total !== 1 ? 's' : ''} found</p>
            </div>
            <select value={sort} onChange={e => updateParam('sort', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-lg font-semibold text-gray-600">No products found</p>
              <p className="text-sm mt-1">Try a different search term or filter</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: Product) => {
                  const price = parseFloat(p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.price)
                  const compare = p.comparePrice ? parseFloat(p.comparePrice) : null
                  const discount = compare ? Math.round((1 - price / compare) * 100) : null
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                      <Link href={`/products/${p.slug}`}>
                        <div className="h-44 bg-gray-50 relative flex items-center justify-center overflow-hidden">
                          {p.images?.[0]?.url ? <Image src={p.images[0].url} alt={p.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform" sizes="200px" /> : <span className="text-4xl">{CATEGORY_ICONS[p.category?.slug] || '📦'}</span>}
                          {discount && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>}
                        </div>
                      </Link>
                      <div className="p-3">
                        <Link href={`/products/${p.slug}`}><p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 hover:text-orange-600 transition-colors">{p.name}</p></Link>
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="font-extrabold text-orange-600 text-sm">₦{price.toLocaleString()}</span>
                          {compare && <span className="text-xs text-gray-400 line-through">₦{compare.toLocaleString()}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400"><span className="text-yellow-400">★</span> {parseFloat(p.vendor?.averageRating || 0).toFixed(1)}</span>
                          <button onClick={() => { addItem({ id: p.id, name: p.name, price, image: p.images?.[0]?.url || '', slug: p.slug }); toast.success('Added to cart') }}
                            disabled={p.stock === 0}
                            className="text-xs px-3 py-1.5 rounded-lg text-white font-bold disabled:opacity-40"
                            style={{ background: '#f68b1f' }}>
                            {p.stock === 0 ? 'OOS' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-orange-400 transition-colors">← Prev</button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const p = i + Math.max(1, page - 2)
                    if (p > totalPages) return null
                    return <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${p === page ? 'text-white' : 'border border-gray-200 hover:border-orange-400'}`} style={p === page ? { background: '#f68b1f' } : {}}>{p}</button>
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-orange-400 transition-colors">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-pulse">🔍</div></div>}><SearchContent /></Suspense>
}
