'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/apiClient'

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type F = z.infer<typeof schema>

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') || ''
  const [done, setDone]  = useState(false)
  const [busy, setBusy]  = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: F) => {
    if (!token) return
    setBusy(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } finally { setBusy(false) }
  }

  if (!token) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-red-500 font-semibold">Invalid reset link. Please request a new one.</div>
        <Link href="/forgot-password" className="mt-4 block text-orange-500 underline">Request new link</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-bold mb-1">Set new password</h1>
        <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account</p>
        {done ? (
          <div className="p-4 rounded-xl text-sm text-center" style={{ background: '#e8f7ef', color: '#1e8a44' }}>
            ✅ Password updated! Redirecting to login…
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">New password</label>
              <input type="password" placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Confirm password</label>
              <input type="password" placeholder="Repeat your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                {...register('confirm')} />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: busy ? '#d1d5db' : '#f68b1f' }}>
              {busy ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-orange-400 text-xl animate-pulse">Loading…</div></div>}><ResetPasswordContent /></Suspense>
}
