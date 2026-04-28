'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Payout } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function VendorEarningsPage() {
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')
  const [requesting, setRequesting] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => api.get('/vendor/profile').then(r => r.data.data),
  })

  const { data: payoutsData } = useQuery({
    queryKey: ['vendor-payouts'],
    queryFn: () => api.get('/vendor/payouts?limit=20').then(r => r.data),
  })

  const requestPayout = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 5000) { toast.error('Minimum withdrawal is ₦5,000'); return }
    const available = parseFloat(profile?.availableBalance || '0')
    if (amt > available) { toast.error('Insufficient available balance'); return }
    setRequesting(true)
    try {
      await api.post('/vendor/payouts', { amount: amt })
      toast.success('Withdrawal request submitted! Admin will process within 2–5 business days.')
      qc.invalidateQueries({ queryKey: ['vendor-payouts'] })
      qc.invalidateQueries({ queryKey: ['vendor-profile'] })
      setAmount('')
    } finally { setRequesting(false) }
  }

  const available = parseFloat(profile?.availableBalance || '0')
  const pending = parseFloat(profile?.pendingBalance || '0')
  const lifetimePaid = parseFloat(profile?.lifetimePaid || '0')
  const payouts = payoutsData?.data || []

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    approved: { bg: '#dbeafe', color: '#1e40af' },
    paid: { bg: '#dcfce7', color: '#15803d' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    on_hold: { bg: '#f3f4f6', color: '#374151' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">Earnings & Payouts</h1>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-6 text-white relative overflow-hidden md:col-span-1" style={{ background: 'linear-gradient(135deg, #d4720e, #f68b1f)' }}>
          <div className="absolute right-4 bottom-2 text-7xl font-extrabold opacity-10">₦</div>
          <p className="text-sm opacity-80 mb-1">Available for Withdrawal</p>
          <p className="text-3xl font-extrabold mb-0.5">₦{available.toLocaleString()}</p>
          <p className="text-xs opacity-70">Cleared funds (7-day hold)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs text-gray-400 mb-1">Pending Clearance</p>
          <p className="text-2xl font-extrabold text-yellow-600">₦{pending.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Recent orders in 7-day hold</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs text-gray-400 mb-1">Lifetime Paid Out</p>
          <p className="text-2xl font-extrabold text-green-600">₦{lifetimePaid.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total disbursed to bank</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Request withdrawal */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-sm text-gray-700 mb-5">Request Withdrawal</h2>
          {!profile?.bankName ? (
            <div className="p-4 rounded-xl text-sm" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              ⚠️ Please add your bank details in <Link href="/vendor/dashboard/profile" className="underline font-semibold">Profile Settings</Link> before requesting a withdrawal.
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-gray-50 mb-4 text-sm">
                <p className="text-gray-500 text-xs mb-0.5">Pay to:</p>
                <p className="font-bold text-gray-800">{profile.bankName}</p>
                <p className="text-gray-600">{profile.bankAccountNumber} · {profile.bankAccountName}</p>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Amount to Withdraw (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Max ₦${available.toLocaleString()}`}
                  max={available}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
                <p className="text-xs text-gray-400 mt-1">Min: ₦5,000 · Max: ₦{available.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl text-xs mb-4" style={{ background: '#fef3c7' }}>
                ⚠️ Withdrawal requests require admin approval and are typically processed within 2–5 business days.
              </div>
              <button
                onClick={requestPayout}
                disabled={requesting || available < 5000}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-colors"
                style={{ background: '#f68b1f' }}
              >
                {requesting ? 'Submitting…' : 'Submit Withdrawal Request'}
              </button>
            </>
          )}
        </div>

        {/* Payout policy */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-sm text-gray-700 mb-4">Payout Policy</h2>
          <div className="space-y-3 text-sm text-gray-600">
            {[
              ['💰', 'Minimum withdrawal: ₦5,000'],
              ['⏰', 'Funds cleared 7 days after delivery confirmation'],
              ['🏦', 'Transfers processed in 2–5 business days'],
              ['✅', 'All requests require admin approval'],
              ['📅', 'Payout schedule: Weekly (every Monday)'],
              ['⚠️', 'Only one pending request allowed at a time'],
            ].map(([icon, text]) => (
              <div key={text as string} className="flex gap-2">
                <span>{icon}</span><span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-800">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No payout history yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Period</th>
                <th className="px-5 py-3 text-left">Bank</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Ref</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p: Payout) => {
                  const s = STATUS_STYLE[p.status] || { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 text-sm text-gray-600">{new Date(p.requestedAt).toLocaleDateString('en-NG')}</td>
                      <td className="px-5 py-4 text-sm font-bold">₦{parseFloat(p.amount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(p.periodStart).toLocaleDateString('en-NG')} – {new Date(p.periodEnd).toLocaleDateString('en-NG')}</td>
                      <td className="px-5 py-4 text-xs text-gray-600">{p.bankName}</td>
                      <td className="px-5 py-4"><span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{p.status}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-400 font-mono">{p.transferRef || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
