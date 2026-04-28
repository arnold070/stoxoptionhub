'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/apiClient'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return }
    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success')
        setTimeout(() => router.push('/login?verified=1'), 3000)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err?.response?.data?.error || 'This verification link is invalid or has expired.')
      })
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">📧</div>
            <h1 className="text-xl font-extrabold mb-2">Verifying your email…</h1>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-extrabold text-green-700 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">Your account is now active. Redirecting you to login…</p>
            <Link href="/login" className="inline-block px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>
              Sign In Now →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-extrabold text-red-600 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>Sign In</Link>
              <Link href="/register" className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">Register Again</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-5xl animate-pulse">📧</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
