'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const schema = z.object({ email: z.string().email() })
type F = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [done, setDone]  = useState(false)
  const [busy, setBusy]  = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: F) => {
    setBusy(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setDone(true)
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">🔑</div>
          <h1 className="text-xl font-bold">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll send a reset link to your email</p>
        </div>
        {done ? (
          <div className="text-center p-4 rounded-xl text-sm" style={{ background: '#e8f7ef', color: '#1e8a44' }}>
            ✅ Check your email for a password reset link. It expires in 1 hour.
            <div className="mt-4"><Link href="/login" className="font-semibold underline">Back to login</Link></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email address</label>
              <input type="email" placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: busy ? '#d1d5db' : '#f68b1f' }}>
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500 pt-2">
              <Link href="/login" className="text-orange-500 hover:underline">← Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
