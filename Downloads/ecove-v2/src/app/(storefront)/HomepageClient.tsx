'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import toast from 'react-hot-toast'

interface Product { id: string; name: string; slug: string; price: string; comparePrice?: string; stock: number; isFlashSale: boolean; flashSalePrice?: string; flashSaleEnd?: string; images: { url: string }[]; category?: { name: string; slug: string }; vendor: { businessName: string; slug: string; averageRating: string }; _count: { reviews: number } }
interface Category { id: string; name: string; slug: string; imageUrl?: string }
interface Banner { id: string; title: string; subtitle?: string; ctaText?: string; ctaLink?: string; imageUrl?: string; bgColor?: string; position: string; displayOrder: number }

const CATEGORY_ICONS: Record<string, string> = {
  'phones-tablets': '📱', 'computing': '💻', 'electronics': '📺', 'fashion': '👗',
  'home-kitchen': '🏠', 'beauty-health': '💄', 'baby-products': '👶',
  'sports-outdoors': '⚽', 'groceries': '🛒', 'automotive': '🚗', 'gaming': '🎮', 'books-education': '📚',
}

const FALLBACK_SLIDES = [
  { title: 'The Latest Smartphones', subtitle: 'Genuine, sealed & delivered fast', ctaText: 'Shop Phones', ctaLink: '/categories/phones-tablets', bgColor: '#1a1a1a', imageUrl: '', emoji: '📱' },
  { title: 'Flash Sale — Up to 50% Off', subtitle: 'Limited time deals across categories', ctaText: 'Shop Now', ctaLink: '/search?flashSale=true', bgColor: '#d4720e', imageUrl: '', emoji: '⚡' },
  { title: 'Fashion for Every Style', subtitle: 'Authentic Ankara, global brands & more', ctaText: 'Explore Fashion', ctaLink: '/categories/fashion', bgColor: '#1e8a44', imageUrl: '', emoji: '👗' },
]

const SLIDE_EMOJIS: Record<string, string> = {
  '#1a1a1a': '📱', '#d4720e': '⚡', '#1e8a44': '👗', '#1976d2': '🏠', '#7c3aed': '💄',
}

function ProductCard({ p }: { p: Product }) {
  const { addItem } = useCart()
  const price   = parseFloat(p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.price)
  const compare = p.comparePrice ? parseFloat(p.comparePrice) : null
  const discount = compare ? Math.round((1 - price / compare) * 100) : null
  const img = p.images?.[0]?.url

  const add = () => {
    addItem({ productId: p.id, name: p.name, price, image: img || '', slug: p.slug })
    toast.success('Added to cart')
  }

  return (
    <div className="relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
      <div className="relative">
        <Link href={`/products/${p.slug}`}>
          <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
            {img
              ? <Image src={img} alt={p.name} fill className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 200px" />
              : <span className="text-5xl">{CATEGORY_ICONS[p.category?.slug || ''] || '📦'}</span>}
          </div>
        </Link>
        {discount && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>}
        {p.stock === 0 && <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded">Out of Stock</span>}
      </div>
      <div className="p-3">
        <Link href={`/products/${p.slug}`}>
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 hover:text-orange-600 transition-colors">{p.name}</p>
        </Link>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-base font-extrabold text-orange-600">₦{price.toLocaleString()}</span>
          {compare && <span className="text-xs text-gray-400 line-through">₦{compare.toLocaleString()}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            <span className="text-yellow-400">★</span> {parseFloat(p.vendor.averageRating || '0').toFixed(1)}
            <span className="ml-1">({p._count.reviews})</span>
          </div>
          <button onClick={add} disabled={p.stock === 0}
            className="text-xs px-3 py-1.5 rounded-lg font-bold text-white transition-colors disabled:opacity-40"
            style={{ background: '#f68b1f' }}>
            Add
          </button>
        </div>
        <Link href={`/store/${p.vendor.slug}`} className="text-xs text-gray-400 hover:text-orange-500 mt-1 block truncate">
          by {p.vendor.businessName}
        </Link>
      </div>
    </div>
  )
}

function FlashCountdown({ end }: { end: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = new Date(end).getTime() - Date.now()
      if (diff <= 0) return
      setTimeLeft({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [end])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-1.5 text-sm font-bold">
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
        <span key={i}>
          <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(v)}</span>
          {i < 2 && <span className="mx-0.5">:</span>}
        </span>
      ))}
    </div>
  )
}

interface HeroSlide {
  title: string; subtitle?: string; ctaText?: string; ctaLink?: string
  bgColor?: string; imageUrl?: string; emoji?: string
}

function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  const current = slides[slide]
  const bg = current.bgColor || '#1a1a1a'
  const emoji = current.emoji || SLIDE_EMOJIS[bg] || '🛍️'

  return (
    <div className="lg:col-span-2 relative rounded-xl overflow-hidden h-64 lg:h-80">
      {current.imageUrl ? (
        <Image src={current.imageUrl} alt={current.title} fill className="absolute inset-0 w-full h-full object-cover" sizes="200px" />
      ) : null}
      <div className="absolute inset-0 flex flex-col justify-center p-8 text-white" style={{ background: current.imageUrl ? 'rgba(0,0,0,0.45)' : bg }}>
        {!current.imageUrl && <div className="text-6xl mb-4">{emoji}</div>}
        <h2 className="text-2xl lg:text-3xl font-extrabold mb-2 leading-tight">{current.title}</h2>
        {current.subtitle && <p className="text-sm opacity-80 mb-4">{current.subtitle}</p>}
        {current.ctaLink && (
          <Link href={current.ctaLink}
            className="inline-block bg-white font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity self-start"
            style={{ color: bg }}>
            {current.ctaText || 'Shop Now'} →
          </Link>
        )}
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
        ))}
      </div>
    </div>
  )
}

export default function HomepageClient({
  featured, categories, flashSale, banners, vendorCount = 184,
}: {
  featured: Product[]; categories: Category[]; flashSale: Product[]; banners: Banner[]; vendorCount?: number
}) {
  // Build hero slides from DB banners (position = hero_slider), fallback to hardcoded
  const heroSlides: HeroSlide[] = banners
    .filter(b => b.position === 'hero_slider')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(b => ({
      title:    b.title,
      subtitle: b.subtitle  || undefined,
      ctaText:  b.ctaText   || 'Shop Now',
      ctaLink:  b.ctaLink   || '/search',
      bgColor:  b.bgColor   || '#1a1a1a',
      imageUrl: b.imageUrl  || undefined,
    }))

  const slides = heroSlides.length > 0 ? heroSlides : FALLBACK_SLIDES

  // Side promo banners
  const sideLeft  = banners.find(b => b.position === 'side_card_left')
  const sideRight = banners.find(b => b.position === 'side_card_right')

  return (
    <div>
      {/* Trust strip */}
      <div className="bg-white border-b border-gray-100">
        <div className="relative max-w-7xl mx-auto px-4 py-2.5 flex justify-between overflow-x-auto gap-6">
          {[['🚚','Free Delivery','Orders over ₦20,000'],['🔒','Secure Payment','Paystack & Flutterwave'],['✅','Verified Sellers','All vendors screened'],['📞','24/7 Support','We\'re here to help']].map(([icon, title, sub]) => (
            <div key={title} className="flex items-center gap-2 shrink-0">
              <span className="text-xl">{icon}</span>
              <div><div className="text-xs font-bold text-gray-800">{title}</div><div className="text-xs text-gray-400">{sub}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="relative max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Category sidebar */}
          <div className="relative hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 font-bold text-sm text-white" style={{ background: '#f68b1f' }}>All Categories</div>
            {categories.map((cat: Category) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors border-b border-gray-50 last:border-0">
                <span>{CATEGORY_ICONS[cat.slug] || '📦'}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>

          {/* Hero Slider */}
          <HeroSlider slides={slides} />

          {/* Promo cards (DB side banners or defaults) */}
          <div className="hidden lg:flex flex-col gap-4">
            {sideLeft ? (
              <Link href={sideLeft.ctaLink || '/search'} className="flex-1 rounded-xl p-4 text-white flex flex-col justify-between overflow-hidden relative"
                style={{ background: sideLeft.bgColor || 'linear-gradient(135deg,#e53935,#f68b1f)' }}>
                {sideLeft.imageUrl && <Image src={sideLeft.imageUrl} alt="" fill className="absolute inset-0 w-full h-full object-cover opacity-40" sizes="200px" />}
                <div className="relative">
                  <div className="font-bold text-sm">{sideLeft.title}</div>
                  {sideLeft.subtitle && <div className="text-xs opacity-80">{sideLeft.subtitle}</div>}
                </div>
              </Link>
            ) : (
              <Link href="/search?flashSale=true" className="flex-1 rounded-xl p-4 text-white flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#e53935,#f68b1f)' }}>
                <div className="text-2xl">⚡</div>
                <div><div className="font-bold text-sm">Flash Sales</div><div className="text-xs opacity-80">Up to 70% off today</div></div>
              </Link>
            )}
            {sideRight ? (
              <Link href={sideRight.ctaLink || '/search'} className="flex-1 rounded-xl p-4 text-white flex flex-col justify-between overflow-hidden relative"
                style={{ background: sideRight.bgColor || 'linear-gradient(135deg,#1e8a44,#22c55e)' }}>
                {sideRight.imageUrl && <Image src={sideRight.imageUrl} alt="" fill className="absolute inset-0 w-full h-full object-cover opacity-40" sizes="200px" />}
                <div className="relative">
                  <div className="font-bold text-sm">{sideRight.title}</div>
                  {sideRight.subtitle && <div className="text-xs opacity-80">{sideRight.subtitle}</div>}
                </div>
              </Link>
            ) : (
              <Link href="/search?bestSeller=true" className="flex-1 rounded-xl p-4 text-white flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#1e8a44,#22c55e)' }}>
                <div className="text-2xl">🏆</div>
                <div><div className="font-bold text-sm">Best Sellers</div><div className="text-xs opacity-80">Most loved products</div></div>
              </Link>
            )}
            <Link href="/search?sort=newest" className="flex-1 rounded-xl p-4 text-white flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#1976d2,#60a5fa)' }}>
              <div className="text-2xl">✨</div>
              <div><div className="font-bold text-sm">New Arrivals</div><div className="text-xs opacity-80">Just landed</div></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <div className="relative max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full inline-block" style={{ background: '#f68b1f' }} />
          Shop by Category
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
          {categories.map((cat: Category) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`}
              className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all text-center group">
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Flash Sale */}
      {flashSale.length > 0 && (
        <div className="py-6" style={{ background: 'linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)' }}>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Flash Sale</h2>
                  <p className="text-xs text-gray-400">Limited time offer</p>
                </div>
                {flashSale[0]?.flashSaleEnd && <FlashCountdown end={flashSale[0].flashSaleEnd} />}
              </div>
              <Link href="/search?flashSale=true" className="text-sm text-orange-400 hover:text-orange-300 font-semibold">See all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {flashSale.slice(0, 8).map((p: Product) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* Full-width banner (DB or skip) */}
      {(() => {
        const fw = banners.find(b => b.position === 'full_width')
        if (!fw) return null
        return (
          <div className="relative max-w-7xl mx-auto px-4 py-4">
            <Link href={fw.ctaLink || '/search'} className="block relative rounded-2xl overflow-hidden h-36"
              style={{ background: fw.bgColor || '#f68b1f' }}>
              {fw.imageUrl && <Image src={fw.imageUrl} alt={fw.title} fill className="absolute inset-0 w-full h-full object-cover" sizes="200px" />}
              <div className="absolute inset-0 flex items-center justify-between px-8" style={{ background: fw.imageUrl ? 'rgba(0,0,0,0.35)' : 'transparent' }}>
                <div className="text-white">
                  <p className="text-xl font-extrabold">{fw.title}</p>
                  {fw.subtitle && <p className="text-sm opacity-80">{fw.subtitle}</p>}
                </div>
                {fw.ctaText && (
                  <span className="bg-white font-bold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shrink-0" style={{ color: fw.bgColor || '#f68b1f' }}>
                    {fw.ctaText} →
                  </span>
                )}
              </div>
            </Link>
          </div>
        )
      })()}

      {/* Featured products */}
      {featured.length > 0 && (
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full inline-block" style={{ background: '#f68b1f' }} />
              Featured Products
            </h2>
            <Link href="/search?featured=true" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured.map((p: Product) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {/* Vendor CTA */}
      <div className="relative mx-4 lg:mx-auto max-w-7xl my-8">
        <div className="rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6" style={{ background: 'linear-gradient(135deg,#d4720e,#f68b1f)' }}>
          <div className="text-white">
            <h3 className="text-2xl lg:text-3xl font-extrabold mb-2">Start Selling on Ecove Today</h3>
            <p className="text-sm opacity-90">Join {vendorCount.toLocaleString()}+ active vendors. Reach thousands of customers across Nigeria.</p>
          </div>
          <Link href="/vendor/register" className="shrink-0 bg-white font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity" style={{ color: '#d4720e' }}>
            Become a Vendor →
          </Link>
        </div>
      </div>
    </div>
  )
}
