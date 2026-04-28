'use client'
import type { Product, Review } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import toast from 'react-hot-toast'

export default function VendorStoreClient({ data }: { data: any }) {
  const { vendor, products, total, reviews, storeCategories } = data
  const { addItem } = useCart()

  return (
    <div>
      {/* Store Banner */}
      <div className="relative">
        <div className="h-48 w-full" style={{
          background: vendor.bannerUrl ? `url(${vendor.bannerUrl}) center/cover` : 'linear-gradient(135deg, #d4720e, #f68b1f)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="relative -mt-10 flex items-end gap-4 pb-4">
            <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center text-3xl shrink-0 overflow-hidden">
              {vendor.logoUrl ? <Image src={vendor.logoUrl} alt={vendor.businessName} fill className="w-full h-full object-cover" sizes="200px" /> : vendor.businessName[0]}
            </div>
            <div className="mb-1">
              <h1 className="text-xl font-extrabold text-gray-900">{vendor.businessName}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold">{parseFloat(vendor.averageRating || 0).toFixed(1)}</span>
                <span>({vendor.reviewCount} reviews)</span>
                <span>·</span>
                <span>📦 {vendor._count.products} products</span>
                <span>·</span>
                <span>📍 {vendor.city}, {vendor.state}</span>
                {vendor.status === 'approved' && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✓ Verified Seller</span>}
              </div>
            </div>
            <div className="ml-auto flex gap-2 mb-1">
              <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors">🔔 Follow</button>
              {vendor.whatsapp && (
                <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}`} target="_blank" className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: '#25d366' }}>💬 WhatsApp</a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pb-12">
        {/* Store stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 mt-4">
          {[
            ['Products', vendor._count.products, '🛍️'],
            ['Orders', vendor.totalOrders, '📦'],
            ['Rating', parseFloat(vendor.averageRating || 0).toFixed(1), '⭐'],
            ['On Time', `${Math.round(parseFloat(vendor.onTimeRate || 0))}%`, '🚚'],
          ].map(([label, value, icon]) => (
            <div key={label as string} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xl font-extrabold">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {vendor.description && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h3 className="font-bold text-sm mb-2">About {vendor.businessName}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
          </div>
        )}

        {/* Category filter tabs */}
        {storeCategories?.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
            <button className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#f68b1f' }}>All</button>
            {storeCategories.map((cat: any) => (
              <button key={cat.id} className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:border-orange-300 text-gray-700 bg-white transition-colors">{cat.name}</button>
            ))}
          </div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
          {products.map((p: Product) => {
            const price = parseFloat(p.isFlashSale && p.flashSalePrice ? p.flashSalePrice : p.price)
            const compare = p.comparePrice ? parseFloat(p.comparePrice) : null
            const discount = compare ? Math.round((1 - price / compare) * 100) : null
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <Link href={`/products/${p.slug}`}>
                  <div className="h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {p.images?.[0]?.url ? <Image src={p.images[0].url} alt={p.name} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform" sizes="200px" /> : <span className="text-4xl">📦</span>}
                    {discount && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{discount}%</span>}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/products/${p.slug}`}><p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5 hover:text-orange-600">{p.name}</p></Link>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-orange-600">₦{price.toLocaleString()}</span>
                    <button onClick={() => { addItem({ id: p.id, name: p.name, price, image: p.images?.[0]?.url || '', slug: p.slug }); toast.success('Added!') }}
                      disabled={p.stock === 0}
                      className="text-xs px-2 py-1 rounded-lg text-white font-bold disabled:opacity-40"
                      style={{ background: '#f68b1f' }}>
                      {p.stock === 0 ? 'OOS' : '+'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reviews */}
        {reviews?.length > 0 && (
          <div>
            <h2 className="text-lg font-extrabold mb-4">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.slice(0, 4).map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">
                      {(r.user?.firstName || 'A')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.user?.firstName} {r.user?.lastName}</p>
                      <div className="text-yellow-400 text-xs">{Array(r.rating).fill('★').join('')}{Array(5 - r.rating).fill('☆').join('')}</div>
                    </div>
                  </div>
                  {r.body && <p className="text-sm text-gray-600 leading-relaxed">"{r.body}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
