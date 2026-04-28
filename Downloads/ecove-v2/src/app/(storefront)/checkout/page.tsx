'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(7, 'Enter a valid phone'),
  addressLine1: z.string().min(5, 'Enter your address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  email: z.string().email('Enter a valid email'),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailUnverified, setEmailUnverified] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  const { data: savedAddresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data.data as any[]),
    enabled: !!user,
  })
  const [coupon, setCoupon] = useState('')
  const [couponData, setCouponData] = useState<{code:string;discountAmount:number;description:string;type:string}|null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    }
  })

  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

  const subtotal = totalPrice()
  const couponDiscount = couponData?.discountAmount || 0
  const hasFreeShipping = couponData?.type === 'free_shipping'
  const shipping = ((subtotal - couponDiscount) >= 20000 || hasFreeShipping) ? 0 : 1500
  const total = subtotal - couponDiscount + shipping

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await api.post('/checkout', {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId ?? undefined })),
        shippingAddress: {
          firstName: data.firstName, lastName: data.lastName, phone: data.phone,
          addressLine1: data.addressLine1, addressLine2: data.addressLine2,
          city: data.city, state: data.state,
        },
        guestEmail: !user ? data.email : undefined,
        guestPhone: !user ? data.phone : undefined,
        notes: data.notes,
        couponCode: couponData?.code || undefined,
      })
      const { paymentUrl } = res.data.data
      // FIX: redirect/navigate FIRST, clear cart after — if redirect fails, cart is preserved
      if (paymentUrl) {
        // Navigate first — if something prevents the redirect, the cart is still intact
        window.location.href = paymentUrl
        // Clear after setting href (executes synchronously before browser navigates away)
        clearCart()
      } else {
        clearCart()
        router.push('/order/confirm')
      }
    } catch {
      // Error shown by apiClient interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {user && !(user as any).isEmailVerified && (
              <div className="p-4 rounded-xl text-sm flex gap-3" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                <span>⚠️</span>
                <span>
                  <strong>Email not verified.</strong> Please verify your email before checkout.{' '}
                  <a href="/verify-email" className="underline font-semibold">Resend verification email →</a>
                </span>
              </div>
            )}
            {emailUnverified && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-bold text-yellow-800 text-sm">Verify your email to place orders</p>
                  <p className="text-yellow-700 text-xs mt-0.5">Check your inbox for a verification link, or{' '}
                    <button onClick={async () => {
                      await api.post('/auth/verify-email/resend').catch(() => {})
                      toast.success('Verification email resent!')
                    }} className="underline font-semibold">click here to resend it</button>.
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-base mb-5">Delivery Information</h2>
              {savedAddresses && savedAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Saved Addresses</p>
                  <div className="space-y-2">
                    {savedAddresses.map((addr: any) => (
                      <button key={addr.id} type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.id)
                          // Populate form fields
                          const vals: any = {
                            firstName: addr.firstName, lastName: addr.lastName,
                            phone: addr.phone, addressLine1: addr.addressLine1,
                            addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state,
                          }
                          Object.entries(vals).forEach(([k, v]) => setValue(k as any, v as string))
                        }}
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-colors ${selectedAddressId === addr.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{addr.firstName} {addr.lastName} · {addr.phone}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{addr.addressLine1}, {addr.city}, {addr.state}</p>
                          </div>
                          {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full shrink-0">Default</span>}
                        </div>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedAddressId(null)}
                      className="text-xs text-orange-600 font-semibold hover:underline">
                      + Use a different address
                    </button>
                  </div>
                  {selectedAddressId && <hr className="mt-4 border-gray-100" />}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['firstName','First Name'],['lastName','Last Name']].map(([f, l]) => (
                  <div key={f}>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">{l}</label>
                    <input {...register(f as keyof FormData)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                    {errors[f as keyof FormData] && <p className="text-red-500 text-xs mt-1">{errors[f as keyof FormData]?.message}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Email {user && <span className="text-gray-400 font-normal">(order confirmation sent here)</span>}
                  </label>
                  {user ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-sm text-gray-600">
                      <span>✉️</span>
                      <span className="truncate">{user.email}</span>
                    </div>
                  ) : (
                    <>
                      <input type="email" {...register('email')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone</label>
                  <input type="tel" {...register('phone')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Address</label>
                <input {...register('addressLine1')} placeholder="Street address" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 mb-2" />
                <input {...register('addressLine2')} placeholder="Apartment, floor (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1.message}</p>}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">City</label>
                  <input {...register('city')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">State</label>
                  <select {...register('state')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                    <option value="">Select state</option>
                    {['Lagos','Abuja (FCT)','Rivers','Oyo','Kano','Delta','Anambra','Ogun','Imo','Enugu','Edo','Kaduna','Kogi','Osun','Ondo','Ekiti','Abia','Akwa Ibom','Bayelsa','Benue','Borno','Cross River','Ebonyi','Gombe','Jigawa','Kebbi','Kwara','Nasarawa','Niger','Plateau','Sokoto','Taraba','Yobe','Zamfara'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Order Notes (optional)</label>
                <textarea {...register('notes')} rows={2} placeholder="Any special instructions…" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none" />
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-base mb-3">Payment</h2>
              <div className="flex items-center gap-3 p-3 border-2 border-orange-400 rounded-xl bg-orange-50">
                <div className="relative w-5 h-5 rounded-full border-2 border-orange-400 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" /></div>
                <span className="text-sm font-semibold text-gray-700">Pay securely with Paystack</span>
                <span className="ml-auto text-xs text-gray-400">Card · Bank · USSD · Transfer</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">You'll be redirected to Paystack's secure payment page to complete your payment.</p>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-base mb-4">Order Summary</h2>
              <div className="relative space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0 overflow-hidden">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="w-full h-full object-cover rounded-lg" sizes="200px" /> : '📦'}
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                      {item.variant && <p className="text-xs text-gray-400">{item.variant.name}: {item.variant.value}</p>}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-800 shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                <button type="button" disabled={couponLoading} onClick={async () => {
                  if (!coupon.trim()) return
                  setCouponLoading(true); setCouponError(''); setCouponData(null)
                  try {
                    const r = await api.post('/coupons/validate', { code: coupon, subtotal })
                    const d = r.data.data
                    setCouponData({ code: d.coupon.code, discountAmount: d.discountAmount, description: d.coupon.description, type: d.coupon.type })
                    toast.success('Coupon applied: ' + d.coupon.description)
                  } catch (e: any) {
                    setCouponError(e?.response?.data?.error || 'Invalid coupon')
                  } finally { setCouponLoading(false) }
                }} className="px-3 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ background: '#f68b1f', color: '#fff' }}>{couponLoading ? '…' : 'Apply'}</button>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                {couponData && (
                <div className="flex justify-between font-semibold text-green-600"><span>Discount ({couponData.code})</span><span>-₦{couponData.discountAmount.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">{shipping === 0 ? 'Free' : `₦${shipping.toLocaleString()}`}</span></div>
                {shipping > 0 && <p className="text-xs text-gray-400">Free shipping on orders over ₦20,000</p>}
                <div className="flex justify-between font-extrabold text-base border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span className="text-orange-600">₦{total.toLocaleString()}</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-60" style={{ background: '#f68b1f' }}>
                {loading ? 'Processing…' : `Pay ₦${total.toLocaleString()} →`}
              </button>
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
              {couponData && <p className="text-xs text-green-600 font-semibold mt-1">✓ {couponData.description} — saving ₦{couponData.discountAmount.toLocaleString()}</p>}
              <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">🔒 Secured by Paystack</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
