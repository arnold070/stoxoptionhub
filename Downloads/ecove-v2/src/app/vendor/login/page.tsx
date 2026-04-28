'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

function VendorLoginContent() {
  const { login }        = useAuth()
  const [busy, setBusy]  = useState(false)
  const searchParams     = useSearchParams()
  const reason           = searchParams.get('reason')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      await login(data.email, data.password)
    } catch {
      // interceptor handles display
    } finally {
      setBusy(false)
    }
  }

  const reasonMessages: Record<string, string> = {
    vendor_only:     'This page is for approved vendors only.',
    session_expired: 'Your session expired. Please sign in again.',
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f5f5' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16" style={{ background: '#1a1a1a' }}>
        <div className="text-4xl font-extrabold text-white mb-3">
          eco<span style={{ color: '#f68b1f' }}>ve</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Vendor Dashboard</h2>
        <p className="text-gray-400 leading-relaxed mb-8">
          Manage your products, track orders, view earnings and grow your business on Nigeria&apos;s marketplace.
        </p>
        <div className="space-y-3">
          {['List products for free', 'Reach thousands of customers', 'Weekly payout to your bank', 'Full sales analytics'].map(f => (
            <div key={f} className="flex items-center gap-3 text-gray-300 text-sm">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#f68b1f' }}>✓</span>
              {f}
            </div>
          ))}
        </div>
        <div className="mt-10 text-sm text-gray-500">
          Not a vendor yet?{' '}
          <Link href="/vendor/register" className="underline" style={{ color: '#f68b1f' }}>Apply now →</Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-2xl font-extrabold text-gray-900 mb-1">Vendor Sign In</div>
          <p className="text-gray-500 text-sm mb-6">Access your seller dashboard</p>

          {reason && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
              ⚠️ {reasonMessages[reason] || 'Please sign in to continue.'}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="vendor@yourbusiness.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-orange-500 hover:underline">Forgot?</Link>
              </div>
              <input type="password" placeholder="Your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: busy ? '#d1d5db' : '#f68b1f' }}>
              {busy ? 'Signing in…' : 'Sign In to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New vendor?{' '}
            <Link href="/vendor/register" className="text-orange-500 font-semibold hover:underline">Apply to sell →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}


export default function VendorLoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white text-2xl font-extrabold animate-pulse">ecove</div></div>}><VendorLoginContent /></Suspense>
}
