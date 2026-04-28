'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

function LoginContent() {
  const { login }        = useAuth()
  const [busy, setBusy]  = useState(false)
  const searchParams     = useSearchParams()
  const registered       = searchParams.get('registered') === '1'
  const verified         = searchParams.get('verified') === '1'
  const reason           = searchParams.get('reason')

  const bannerMessages: Record<string, { msg: string; type: 'success' | 'info' | 'warn' }> = {
    admin_only:      { msg: 'Admin access only. Please sign in with an admin account.', type: 'warn' },
    vendor_only:     { msg: 'Vendor dashboard access only. Please sign in as a vendor.', type: 'warn' },
    session_expired: { msg: 'Your session expired. Please sign in again.', type: 'warn' },
  }
  const banner = reason ? bannerMessages[reason] : null

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
    } catch (err: any) {
      // error shown by axios interceptor
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold" style={{ color: '#f68b1f' }}>
            eco<span className="text-gray-800">ve</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        {registered && (
          <div className="mb-4 p-4 rounded-xl text-sm font-medium" style={{ background: '#e8f7ef', color: '#1e8a44' }}>
            ✅ Account created! Check your email to verify before signing in.
          </div>
        )}
        {verified && (
          <div className="mb-4 p-4 rounded-xl text-sm font-medium" style={{ background: '#e8f7ef', color: '#1e8a44' }}>
            ✅ Email verified! You can now sign in.
          </div>
        )}
        {banner && (
          <div className="mb-4 p-4 rounded-xl text-sm font-medium" style={{ background: banner.type === 'warn' ? '#fef3c7' : '#dbeafe', color: banner.type === 'warn' ? '#92400e' : '#1e40af' }}>
            ⚠️ {banner.msg}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-orange-500 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                {...register('password')}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: busy ? '#d1d5db' : '#f68b1f' }}
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-orange-500 font-semibold hover:underline">Create account</Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/vendor/register" className="text-sm text-gray-400 hover:text-orange-500">
              Want to sell on Ecove? Apply as a vendor →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-4xl animate-pulse" style={{ color: '#f68b1f' }}>ecove</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
