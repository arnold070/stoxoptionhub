'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(2, 'Min 2 characters'),
  lastName: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7).optional().or(z.literal('')),
  password: z.string().min(8, 'Min 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      await api.post('/auth/register', { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, password: data.password })
      toast.success('Account created! Please check your email to verify.')
      router.push('/login?registered=1')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-extrabold" style={{ color: '#f68b1f' }}>eco<span className="text-gray-800">ve</span></Link>
          <p className="text-gray-500 mt-2 text-sm">Create your free account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['firstName','First Name'],['lastName','Last Name']].map(([f, l]) => (
                <div key={f}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{l}</label>
                  <input {...register(f as keyof FormData)} className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
                  {errors[f as keyof FormData] && <p className="text-red-500 text-xs mt-0.5">{errors[f as keyof FormData]?.message}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" {...register('email')} className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
              {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone (optional)</label>
              <input type="tel" {...register('phone')} placeholder="+234 800 000 0000" className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" {...register('password')} className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <input type="password" {...register('confirm')} className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
              {errors.confirm && <p className="text-red-500 text-xs mt-0.5">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all" style={{ background: busy ? '#d1d5db' : '#f68b1f' }}>
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">Already have an account? <Link href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link></p>
          <p className="mt-3 text-center"><Link href="/vendor/register" className="text-xs text-gray-400 hover:text-orange-500">Want to sell on Ecove? Apply as a vendor →</Link></p>
        </div>
      </div>
    </div>
  )
}
