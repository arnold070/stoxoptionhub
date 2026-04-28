'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/context/AuthContext'

const CATEGORIES = [
  ['All Categories',  '/search'],
  ['Phones',          '/categories/phones-tablets'],
  ['Electronics',     '/categories/electronics'],
  ['Computing',       '/categories/computing'],
  ['Fashion',         '/categories/fashion'],
  ['Home & Kitchen',  '/categories/home-kitchen'],
  ['Beauty',          '/categories/beauty-health'],
  ['Baby',            '/categories/baby-products'],
  ['Sports',          '/categories/sports-outdoors'],
  ['Groceries',       '/categories/groceries'],
  ['Gaming',          '/categories/gaming'],
]

function Header() {
  const { items, totalItems, totalPrice, isOpen, toggleCart, removeItem, updateQuantity } = useCart()
  const { user, logout } = useAuth()
  const [query,       setQuery]       = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] } | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const suggestRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router   = useRouter()
  const pathname = usePathname()
  const cartRef  = useRef<HTMLDivElement>(null)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close cart on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node) && isOpen) toggleCart()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, toggleCart])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSuggestOpen(false)
    if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setMenuOpen(false) }
  }

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (suggestRef.current) clearTimeout(suggestRef.current)
    if (val.length < 2) { setSuggestOpen(false); return }
    suggestRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/storefront/search?q=${encodeURIComponent(val)}&typeahead=true`)
        const data = await res.json()
        setSuggestions(data.data)
        setSuggestOpen(true)
      } catch { /* silent */ }
    }, 300)
  }

  return (
    <>
      {/* Top bar */}
      <div style={{ background: '#1a1a1a' }} className="text-white py-1.5 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4">
            <span>📞 +234 800 ECOVE</span>
            <Link href="/vendor/register" className="opacity-70 hover:opacity-100">Sell on Ecove</Link>
          </div>
          <div className="hidden sm:flex gap-4 opacity-70">
            <span>🚚 Free delivery on orders over ₦20,000</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header style={{ background: '#f68b1f' }} className="sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 text-white shrink-0"
            aria-label="Open menu"
          >
            <span className={`block h-0.5 w-5 bg-white rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-5 bg-white rounded transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-white rounded transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

          {/* Logo */}
          <Link href="/" className="font-display text-2xl font-extrabold text-white shrink-0">
            eco<span className="opacity-80">ve</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl relative">
          <form onSubmit={handleSearch} className="flex bg-white rounded-lg overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 200)}
              onFocus={() => query.length >= 2 && setSuggestOpen(true)}
              placeholder="Search products, brands, categories…"
              autoComplete="off"
              className="flex-1 px-4 py-2.5 text-sm text-gray-800 outline-none"
            />
            <button type="submit" style={{ background: '#d4720e' }} className="px-4 text-white text-base">🔍</button>
          </form>
          {/* Autocomplete dropdown */}
          {suggestOpen && suggestions && (suggestions.products?.length > 0 || suggestions.categories?.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-96 overflow-y-auto">
              {suggestions.categories?.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide px-2 mb-1.5">Categories</p>
                  {suggestions.categories.map((cat: any) => (
                    <button key={cat.id} onMouseDown={() => { router.push(`/categories/${cat.slug}`); setSuggestOpen(false); setQuery('') }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-orange-50 text-left transition-colors">
                      <span className="text-base">🗂️</span>
                      <span className="font-medium text-gray-700">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.products?.length > 0 && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide px-2 mt-2 mb-1.5">Products</p>
                  {suggestions.products.map((p: any) => (
                    <button key={p.id} onMouseDown={() => { router.push(`/products/${p.slug}`); setSuggestOpen(false); setQuery('') }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-orange-50 text-left transition-colors">
                      <div className="relative w-9 h-9 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {p.images?.[0]?.url ? <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="36px" /> : <span>📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-orange-600 font-bold text-xs">₦{parseFloat(p.price).toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                  <button onMouseDown={() => { router.push(`/search?q=${encodeURIComponent(query)}`); setSuggestOpen(false) }}
                    className="w-full mt-1 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                    See all results for "{query}" →
                  </button>
                </div>
              )}
            </div>
          )}

          </div>
          {/* Nav icons */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* Account dropdown */}
            <div className="relative group">
              <button className="flex flex-col items-center px-3 py-1 text-white hover:bg-white/10 rounded-lg transition-colors">
                <span className="text-lg">👤</span>
                <span className="text-xs hidden sm:block">{user ? user.firstName : 'Account'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden group-hover:block z-50">
                {user ? (
                  <>
                    <Link href="/account"  className="block px-4 py-2 text-sm hover:bg-gray-50">My Account</Link>
                    <Link href="/orders"   className="block px-4 py-2 text-sm hover:bg-gray-50">My Orders</Link>
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                      <Link href="/admin"  className="block px-4 py-2 text-sm hover:bg-gray-50 font-semibold text-orange-600">Admin Panel</Link>
                    )}
                    {user.role === 'vendor' && (
                      <Link href="/vendor/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-50 font-semibold text-orange-600">Vendor Dashboard</Link>
                    )}
                    <hr className="my-1" />
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login"    className="block px-4 py-2 text-sm hover:bg-gray-50 font-semibold">Sign In</Link>
                    <Link href="/register" className="block px-4 py-2 text-sm hover:bg-gray-50">Create Account</Link>
                    <hr className="my-1" />
                    <Link href="/vendor/register" className="block px-4 py-2 text-sm text-orange-600 hover:bg-gray-50">Sell on Ecove</Link>
                  </>
                )}
              </div>
            </div>

            {/* Wishlist */}
            <Link href="/account?tab=wishlist" className="flex flex-col items-center px-3 py-1 text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="text-lg">♡</span>
              <span className="text-xs hidden sm:block">Wishlist</span>
            </Link>

            {/* Cart */}
            <div ref={cartRef} className="relative">
              <button onClick={toggleCart} className="flex flex-col items-center px-3 py-1 text-white hover:bg-white/10 rounded-lg transition-colors relative">
                <span className="text-lg">🛒</span>
                <span className="text-xs hidden sm:block">Cart</span>
                {totalItems() > 0 && (
                  <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* Cart Drawer */}
              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b flex justify-between items-center">
                    <span className="font-bold text-sm">My Cart ({totalItems()})</span>
                    <button onClick={toggleCart} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                  </div>
                  {items.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">
                      <div className="text-4xl mb-2">🛒</div>
                      Your cart is empty
                    </div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto divide-y">
                        {items.map(item => (
                          <div key={item.id} className="flex gap-3 p-3">
                            <div className="relative w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0 overflow-hidden">
                              {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover rounded-lg" sizes="48px" /> : '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-orange-600 font-bold">₦{item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-5 h-5 border rounded text-xs flex items-center justify-center hover:bg-gray-100">−</button>
                                <span className="text-xs font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))} className="w-5 h-5 border rounded text-xs flex items-center justify-center hover:bg-gray-100">+</button>
                              </div>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-sm self-start">✕</button>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between text-sm font-bold mb-3">
                          <span>Total:</span>
                          <span className="text-orange-600">₦{totalPrice().toLocaleString()}</span>
                        </div>
                        <Link href="/checkout" onClick={toggleCart}
                          className="block w-full py-2.5 rounded-lg text-white text-sm font-bold text-center"
                          style={{ background: '#f68b1f' }}>
                          Proceed to Checkout →
                        </Link>
                        <Link href="/cart" onClick={toggleCart} className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-2">
                          View full cart
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop category nav */}
        <div style={{ background: '#d4720e' }} className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 overflow-x-auto text-white text-sm">
            {CATEGORIES.map(([label, href]) => (
              <Link key={href} href={href} className="px-4 py-2.5 whitespace-nowrap hover:bg-white/10 transition-colors font-medium">
                {label}
              </Link>
            ))}
            <Link href="/search?flashSale=true" className="px-4 py-2.5 whitespace-nowrap hover:bg-white/10 transition-colors font-bold text-yellow-300">
              ⚡ Flash Sales
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-200 ${menuOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-200 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Drawer header */}
          <div className="px-4 py-4 flex items-center justify-between shrink-0" style={{ background: '#f68b1f' }}>
            <Link href="/" className="font-display text-xl font-extrabold text-white" onClick={() => setMenuOpen(false)}>
              eco<span className="opacity-80">ve</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="text-white text-xl leading-none">✕</button>
          </div>

          {/* Auth quick links */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: '#f68b1f' }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <Link href="/account" className="text-xs text-orange-600 hover:underline" onClick={() => setMenuOpen(false)}>My Account</Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login"    onClick={() => setMenuOpen(false)} className="flex-1 py-2 text-center text-sm font-bold rounded-lg" style={{ background: '#f68b1f', color: '#fff' }}>Sign In</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 py-2 text-center text-sm font-bold rounded-lg border border-gray-200 text-gray-700">Register</Link>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <form onSubmit={handleSearch} className="flex bg-gray-100 rounded-lg overflow-hidden">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none" />
              <button type="submit" className="px-3 text-gray-500">🔍</button>
            </form>
          </div>

          {/* Category links */}
          <nav className="flex-1 overflow-y-auto">
            <p className="px-4 pt-3 pb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Categories</p>
            {CATEGORIES.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 border-b border-gray-50 last:border-0 transition-colors">
                {label}
              </Link>
            ))}
            <Link href="/search?flashSale=true" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-50 border-b border-gray-50">
              ⚡ Flash Sales
            </Link>

            {user && (
              <>
                <p className="px-4 pt-4 pb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">My Account</p>
                <Link href="/orders"  onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50">📦 My Orders</Link>
                <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50">👤 Profile</Link>
                {user.role === 'vendor' && (
                  <Link href="/vendor/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 border-b border-gray-50">🏪 Vendor Dashboard</Link>
                )}
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 border-b border-gray-50">⚙️ Admin Panel</Link>
                )}
              </>
            )}
          </nav>

          {/* Bottom CTA */}
          <div className="px-4 py-4 border-t border-gray-100 shrink-0">
            <Link href="/vendor/register" onClick={() => setMenuOpen(false)}
              className="block w-full py-3 text-center text-sm font-bold text-white rounded-xl" style={{ background: '#f68b1f' }}>
              🏪 Sell on Ecove
            </Link>
            {user && (
              <button onClick={() => { logout(); setMenuOpen(false) }} className="block w-full mt-2 py-2.5 text-center text-sm text-red-400 hover:text-red-600 font-medium">
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#1a1a1a' }} className="text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="font-display text-2xl font-extrabold mb-3 text-white">eco<span style={{ color: '#f68b1f' }}>ve</span></div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">Nigeria's fastest-growing multi-vendor marketplace. Shop from verified sellers nationwide.</p>
          <div className="flex gap-3">
            {['f', 'X', 'ig', 'wa'].map(s => (
              <button key={s} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs flex items-center justify-center font-bold">
                {s}
              </button>
            ))}
          </div>
        </div>
        {[
          { title: 'Shop',    links: [['All Products','/search'],['Flash Sales','/search?flashSale=true'],['New Arrivals','/search?sort=newest'],['Best Sellers','/search?bestSeller=true']] },
          { title: 'Sellers', links: [['Sell on Ecove','/vendor/register'],['Vendor Login','/vendor/login'],['Vendor Policies','/vendor-policies'],['Commission Rates','/vendor-policies#commission']] },
          { title: 'Help',    links: [['Contact Us','mailto:hello@ecove.com.ng'],['Track Order','/track'],['Returns Policy','/returns'],['Privacy Policy','/privacy']] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="font-bold text-sm mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-gray-400 text-sm hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Ecove Marketplace · ecove.com.ng · All rights reserved
      </div>
    </footer>
  )
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
