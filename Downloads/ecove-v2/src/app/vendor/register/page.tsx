'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(2), lastName: z.string().min(2),
  email: z.string().email(), password: z.string().min(8),
  phone: z.string().min(7),
  businessName: z.string().min(2),
  description: z.string().min(50, 'Min 50 characters'),
  city: z.string().min(2), state: z.string().min(2),
  address: z.string().min(5),
  bankName: z.string().min(2),
  bankAccountNumber: z.string().length(10, 'Must be 10 digits'),
  bankAccountName: z.string().min(2),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
})
type FormData = z.infer<typeof schema>

const STEPS = ['Business Info', 'Bank Details', 'Terms & Submit']

export default function VendorRegisterPage() {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [idDocUrl, setIdDocUrl] = useState('')
  const [cacUrl, setCacUrl] = useState('')

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreedToTerms: true as any },
  })

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>, setter: (u: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'id-docs')
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setter(res.data.data.url)
      toast.success('Document uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ['firstName', 'lastName', 'email', 'password', 'phone', 'businessName', 'description', 'city', 'state', 'address'],
      1: ['bankName', 'bankAccountNumber', 'bankAccountName'],
    }
    const valid = await trigger(fields[step])
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      await api.post('/auth/vendor-register', { ...data, idDocumentUrl: idDocUrl || undefined, cacDocumentUrl: cacUrl || undefined })
      setDone(true)
    } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold mb-3">Application Submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">Thank you for applying to sell on Ecove. Our admin team will review your application within <strong>24–48 hours</strong>. Check your email for updates.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>← Back to Ecove</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-extrabold" style={{ color: '#f68b1f' }}>eco<span className="text-gray-800">ve</span></Link>
          <h1 className="text-xl font-extrabold text-gray-900 mt-3">Become an Ecove Vendor</h1>
          <p className="text-gray-400 text-sm mt-1">Join Nigeria's growing marketplace. Applications reviewed within 48 hours.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${i === step ? 'text-orange-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`} style={i === step ? { background: '#f68b1f' } : {}}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">

            {/* Step 0: Business Info */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-base mb-5">🏢 Business Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[['firstName','First Name'],['lastName','Last Name']].map(([f,l]) => (
                    <div key={f}>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">{l} *</label>
                      <input {...register(f as keyof FormData)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                      {errors[f as keyof FormData] && <p className="text-red-500 text-xs mt-0.5">{errors[f as keyof FormData]?.message}</p>}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Email *</label>
                    <input type="email" {...register('email')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Password *</label>
                    <input type="password" {...register('password')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone *</label>
                  <input type="tel" {...register('phone')} placeholder="+234 800 000 0000" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Business Name *</label>
                  <input {...register('businessName')} placeholder="Your store name" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  {errors.businessName && <p className="text-red-500 text-xs mt-0.5">{errors.businessName.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Business Description * <span className="text-gray-400">(min 50 chars)</span></label>
                  <textarea {...register('description')} rows={3} placeholder="Describe your business, what you sell, your experience…" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none" />
                  {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">City *</label>
                    <input {...register('city')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">State *</label>
                    <select {...register('state')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                      <option value="">Select state</option>
                      {['Lagos','Abuja (FCT)','Rivers','Oyo','Kano','Delta','Anambra','Ogun','Imo','Enugu','Edo','Kaduna'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Business Address *</label>
                  <input {...register('address')} placeholder="Street, city, state" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            )}

            {/* Step 1: Bank + Docs */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-base mb-5">🏦 Bank Details for Payouts</h2>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Bank Name *</label>
                  <select {...register('bankName')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                    <option value="">— Select Bank —</option>
                    {['First Bank of Nigeria','Guaranty Trust Bank (GTBank)','Zenith Bank','Access Bank','UBA','Fidelity Bank','Opay','Palmpay','Kuda Bank','FCMB','Sterling Bank','Wema Bank'].map(b => <option key={b}>{b}</option>)}
                  </select>
                  {errors.bankName && <p className="text-red-500 text-xs mt-0.5">{errors.bankName.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Account Number *</label>
                    <input {...register('bankAccountNumber')} maxLength={10} placeholder="10-digit NUBAN" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    {errors.bankAccountNumber && <p className="text-red-500 text-xs mt-0.5">{errors.bankAccountNumber.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Account Name *</label>
                    <input {...register('bankAccountName')} placeholder="As on your account" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-bold text-sm text-gray-700 mb-4">🪪 Identity Verification</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Government ID</label>
                      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                        <input type="file" accept="image/*,.pdf" onChange={e => uploadDoc(e, setIdDocUrl)} className="hidden" />
                        <div className="text-2xl mb-1">{idDocUrl ? '✅' : '🪪'}</div>
                        <p className="text-xs text-gray-500">{idDocUrl ? 'Uploaded' : 'NIN, Passport, or Voter's Card'}</p>
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">CAC Certificate <span className="text-gray-400">(optional)</span></label>
                      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                        <input type="file" accept="image/*,.pdf" onChange={e => uploadDoc(e, setCacUrl)} className="hidden" />
                        <div className="text-2xl mb-1">{cacUrl ? '✅' : '📋'}</div>
                        <p className="text-xs text-gray-500">{cacUrl ? 'Uploaded' : 'Business registration'}</p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Terms */}
            {step === 2 && (
              <div>
                <h2 className="font-bold text-base mb-5">📋 Review & Submit</h2>
                <div className="border border-gray-200 rounded-xl p-4 h-48 overflow-y-auto text-xs text-gray-500 leading-relaxed mb-4">
                  <strong className="text-gray-700">Ecove Marketplace Vendor Agreement</strong><br/><br/>
                  By registering as a vendor you agree to:<br/><br/>
                  <strong>1. Product Listings:</strong> Only list products you own or have authority to sell. All listings must be accurate. Counterfeit items result in immediate termination.<br/><br/>
                  <strong>2. Admin Approval:</strong> All products require admin review before going live. Ecove may approve, reject or remove any listing at its discretion.<br/><br/>
                  <strong>3. Commission:</strong> Ecove charges a category-based commission on each sale. Rates are shown in your dashboard.<br/><br/>
                  <strong>4. Payouts:</strong> Earnings clear 7 days after delivery. Minimum payout ₦5,000. All requests require admin approval.<br/><br/>
                  <strong>5. Compliance:</strong> You must comply with Nigerian law including consumer protection, tax, and customs requirements.<br/><br/>
                  <strong>6. Termination:</strong> Ecove may suspend or terminate accounts at any time for policy violations, fraud, or poor performance.
                </div>
                <label className="flex items-start gap-3 cursor-pointer mb-2">
                  <input type="checkbox" {...register('agreedToTerms')} className="mt-0.5 accent-orange-500 w-4 h-4" />
                  <span className="text-sm text-gray-700">I have read and agree to the Ecove Vendor Terms of Service and Marketplace Policies</span>
                </label>
                {errors.agreedToTerms && <p className="text-red-500 text-xs mb-4">{errors.agreedToTerms.message}</p>}
                <p className="text-xs text-gray-400 mb-5">Application review typically takes 24–48 hours. You'll receive an email once a decision is made.</p>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">← Back</button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={nextStep} className="flex-1 py-3 rounded-xl text-white font-bold text-sm" style={{ background: '#f68b1f' }}>
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={busy || uploading} className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: '#f68b1f' }}>
                  {busy ? 'Submitting…' : 'Submit Application →'}
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">Already have an account? <Link href="/vendor/login" className="text-orange-500 underline">Sign in</Link></p>
      </div>
    </div>
  )
}
