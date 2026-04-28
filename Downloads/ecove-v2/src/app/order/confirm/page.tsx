'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/apiClient'

type Status = 'loading' | 'paid' | 'failed' | 'error'

function OrderConfirmContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || searchParams.get('reference') || ''
  const [status, setStatus] = useState<Status>('loading')
  const [orderNumber, setOrderNumber] = useState('')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!ref) { setStatus('error'); return }

    let timer: ReturnType<typeof setTimeout>

    const verify = async () => {
      try {
        // Call our verify endpoint which checks Paystack and updates DB
        const { data } = await api.get(`/payments/paystack?reference=${ref}`)
        if (data.status === 'paid') {
          setOrderNumber(ref)
          setStatus('paid')
        } else if (attempts < 4) {
          // Webhook may still be processing — retry up to 4 times with backoff
          setAttempts(a => a + 1)
          timer = setTimeout(verify, 2000)
        } else {
          setStatus('failed')
        }
      } catch {
        if (attempts < 2) {
          setAttempts(a => a + 1)
          timer = setTimeout(verify, 3000)
        } else {
          setStatus('error')
        }
      }
    }

    // Small initial delay to allow webhook to process first
    timer = setTimeout(verify, 1500)
    return () => clearTimeout(timer)
  }, [ref, attempts])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h1 className="text-xl font-bold mb-2">Confirming your payment…</h1>
            <p className="text-gray-500 text-sm">Please wait while we verify your transaction with Paystack.</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#f68b1f', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#1e8a44' }}>Order Confirmed!</h1>
            <p className="text-gray-600 text-sm mb-1">Your payment was successful.</p>
            <p className="text-gray-400 text-xs mb-6">Reference: <span className="font-mono font-bold">{orderNumber}</span></p>
            <p className="text-gray-500 text-sm mb-6">
              The vendor has been notified and will process your order. You&apos;ll receive a confirmation email shortly.
            </p>
            <div className="space-y-3">
              <Link href="/orders" className="block w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#f68b1f' }}>
                Track My Order →
              </Link>
              <Link href="/" className="block w-full py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50">
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-xl font-bold mb-2">Payment Processing</h1>
            <p className="text-gray-500 text-sm mb-4">
              Your payment is still being confirmed. If money was deducted, your order will appear in{' '}
              <Link href="/orders" className="text-orange-500 underline font-semibold">My Orders</Link>{' '}
              within a few minutes.
            </p>
            <p className="text-gray-400 text-xs mb-6">Reference: <span className="font-mono">{ref}</span></p>
            <div className="space-y-3">
              <Link href="/orders" className="block w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#f68b1f' }}>
                Check My Orders
              </Link>
              <a href={`mailto:hello@ecove.com.ng?subject=Order+Query+${ref}`} className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Contact Support
              </a>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">
              We could not verify your payment. If you were charged, please contact support with reference: <span className="font-mono font-bold">{ref}</span>
            </p>
            <div className="space-y-3">
              <a href={`mailto:hello@ecove.com.ng?subject=Payment+Issue+${ref}`} className="block w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#f68b1f' }}>
                Contact Support
              </a>
              <Link href="/" className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                Go Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-5xl animate-pulse">⏳</div>
      </div>
    }>
      <OrderConfirmContent />
    </Suspense>
  )
}
