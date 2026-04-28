'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const NAV = [
  { href: '/vendor/dashboard',              icon: '📊', label: 'Overview'    },
  { href: '/vendor/dashboard/products',     icon: '🛍️', label: 'Products'    },
  { href: '/vendor/dashboard/orders',       icon: '📦', label: 'Orders'      },
  { href: '/vendor/dashboard/earnings',     icon: '💸', label: 'Earnings'    },
  { href: '/vendor/dashboard/inventory',    icon: '📋', label: 'Inventory'   },
  { href: '/vendor/dashboard/reports',      icon: '📈', label: 'Reports'     },
  { href: '/vendor/dashboard/store',        icon: '🏪', label: 'My Store'    },
  { href: '/vendor/dashboard/reviews',     icon: '⭐', label: 'Reviews'     },
  { href: '/vendor/dashboard/returns',     icon: '🔄', label: 'Returns'     },
  { href: '/vendor/dashboard/profile',      icon: '⚙️', label: 'Settings'    },
]

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'vendor')) {
      router.replace('/vendor/login?reason=vendor_only')
    }
  }, [user, loading, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🏪</div>
        <div className="text-gray-500 text-sm">Loading your dashboard…</div>
      </div>
    </div>
  )

  if (!user || user.role !== 'vendor') return null

  const isActive = (href: string) =>
    href === '/vendor/dashboard' ? pathname === '/vendor/dashboard' : pathname.startsWith(href)

  const vendor = (user as any).vendor

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ─────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col shadow-xl transition-transform duration-200 md:translate-x-0 md:static md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#1a1a1a' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link href="/" className="font-display text-xl font-extrabold text-white">
            eco<span style={{ color: '#f68b1f' }}>ve</span>
            <span className="ml-2 text-xs font-normal text-gray-400">seller</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Vendor info */}
        {vendor && (
          <div className="px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {vendor.logoUrl ? <Image src={vendor.logoUrl} alt={vendor.businessName} fill className="object-cover" sizes="36px" /> : vendor.businessName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{vendor.businessName}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${vendor.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {vendor.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                isActive(item.href)
                  ? 'text-white font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={isActive(item.href) ? { background: '#f68b1f' } : {}}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: '#f68b1f' }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-gray-500 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1 text-center text-xs py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              🛒 Store
            </Link>
            <button onClick={logout} className="flex-1 text-center text-xs py-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-lg leading-none"
          >
            ☰
          </button>
          <p className="text-sm font-semibold text-gray-700 hidden md:block">
            {NAV.find(n => isActive(n.href))?.label || 'Vendor Dashboard'}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/vendor/dashboard/products/new"
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white hidden sm:inline-block"
              style={{ background: '#f68b1f' }}>
              + Add Product
            </Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-orange-600 transition-colors">
              View Store →
            </Link>
          </div>
        </div>

        {/* Page */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
