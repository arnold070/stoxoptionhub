'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Add products from the marketplace to get started.</p>
        <Link href="/search" className="inline-block px-8 py-3 rounded-xl text-white font-bold" style={{ background: '#f68b1f' }}>
          Start Shopping →
        </Link>
      </div>
    )
  }

  const subtotal = totalPrice()
  const shipping = subtotal >= 20000 ? 0 : 1500
  const total = subtotal + shipping

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Shopping Cart <span className="text-gray-400 font-normal text-lg">({totalItems()} items)</span></h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 font-medium">Clear cart</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
              <div className="relative w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {item.image
                  ? <Image src={item.image} alt={item.name} fill className="w-full h-full object-cover" sizes="200px" />
                  : <span className="text-3xl">📦</span>}
              </div>
              <div className="relative flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="font-semibold text-gray-800 text-sm hover:text-orange-600 line-clamp-2 block">{item.name}</Link>
                {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}: {item.variant.value}</p>}
                <p className="text-base font-extrabold text-orange-600 mt-1">₦{item.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0">
                <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-lg transition-colors">✕</button>
                <div className="relative flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">−</button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h2 className="font-bold text-base mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal ({totalItems()} items)</span><span>₦{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString()}`}</span></div>
              {shipping > 0 && <p className="text-xs text-gray-400">Free delivery on orders over ₦20,000</p>}
            </div>
            <div className="flex justify-between font-extrabold text-base border-t border-gray-100 pt-3 mb-4">
              <span>Total</span>
              <span className="text-orange-600">₦{total.toLocaleString()}</span>
            </div>
            <Link href="/checkout" className="block w-full py-3.5 rounded-xl text-white font-bold text-sm text-center transition-colors" style={{ background: '#f68b1f' }}>
              Proceed to Checkout →
            </Link>
            <Link href="/search" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
