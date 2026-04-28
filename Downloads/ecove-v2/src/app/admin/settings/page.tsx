'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const MASK = '••••••••••••••••'

// Keys that contain secrets — show a "set" badge, not the value
const SECRET_KEYS = new Set([
  'payment.paystack.secret_key',
  'payment.paystack.webhook_secret',
  'payment.flutterwave.secret_key',
  'payment.flutterwave.webhook_secret',
  'email.smtp.pass',
  'bank.account_number',
])

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [changed, setChanged]   = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'general'|'payments'|'email'|'bank'>('general')
  const [testEmailTo, setTestEmailTo] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const { isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => {
      const d = r.data.data
      setSettings(d)
      setOriginal(d)
      return d
    }),
  })

  const save = useMutation({
    mutationFn: (data: any) => api.put('/admin/settings', data),
    onSuccess: () => {
      toast.success('Settings saved')
      setChanged({})
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const set = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setChanged(prev => ({ ...prev, [key]: true }))
  }

  const hasChanges = Object.keys(changed).length > 0

  const sendTest = async () => {
    if (!testEmailTo) return
    setTestingEmail(true)
    try {
      const r = await api.post('/admin/settings', { action: 'test_email', to: testEmailTo })
      if (r.data.data.success) toast.success(r.data.data.message)
      else toast.error(r.data.data.message)
    } catch {
      toast.error('Test failed — check your SMTP settings')
    } finally {
      setTestingEmail(false)
    }
  }

  // ── Field components ──────────────────────────────────────
  const Field = ({
    label, k, type = 'text', hint, placeholder, prefix
  }: {
    label: string; k: string; type?: string
    hint?: string; placeholder?: string; prefix?: string
  }) => {
    const isSecret   = SECRET_KEYS.has(k)
    const isRevealed = showSecrets[k]
    const isSet      = original[k] && original[k] !== MASK
    const isDirty    = changed[k]

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">{label}</label>
          {isSecret && isSet && !isDirty && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">✓ Set</span>
          )}
        </div>
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-gray-400 select-none">{prefix}</span>
          )}
          <input
            type={isSecret && !isRevealed && !isDirty ? 'password' : type}
            value={isDirty ? settings[k] || '' : (isSecret && isSet ? MASK : settings[k] || '')}
            placeholder={placeholder || (isSecret && isSet ? 'Leave blank to keep current value' : '')}
            onChange={e => set(k, e.target.value)}
            onFocus={() => {
              // Clear mask on focus so admin can type a new value
              if (isSecret && !isDirty && settings[k] === MASK) {
                setSettings(prev => ({ ...prev, [k]: '' }))
              }
            }}
            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors ${
              prefix ? 'pl-7' : ''
            } ${isDirty ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => setShowSecrets(p => ({ ...p, [k]: !p[k] }))}
              className="absolute right-3 text-xs text-gray-400 hover:text-gray-600"
            >
              {isRevealed ? '🙈' : '👁'}
            </button>
          )}
        </div>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    )
  }

  const Toggle = ({ label, k, desc }: { label: string; k: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
      <button
        onClick={() => set(k, settings[k] === 'true' ? 'false' : 'true')}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{ background: settings[k] === 'true' ? '#f68b1f' : '#d1d5db' }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: settings[k] === 'true' ? '22px' : '2px' }}
        />
      </button>
    </div>
  )

  const SectionHint = ({ text }: { text: string }) => (
    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-4 leading-relaxed">{text}</p>
  )

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl animate-pulse mb-3">⚙️</div>
      <p className="text-gray-400 text-sm">Loading settings…</p>
    </div>
  )

  const TABS = [
    { id: 'general',  label: 'General',  icon: '🏪' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'email',    label: 'Email',    icon: '📧' },
    { id: 'bank',     label: 'Bank',     icon: '🏦' },
  ] as const

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Marketplace Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure payments, email, and marketplace behaviour</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {/* Dot if this tab has unsaved changes */}
            {Object.keys(changed).some(k => {
              if (tab.id === 'payments') return k.startsWith('payment.')
              if (tab.id === 'email')    return k.startsWith('email.') || k.startsWith('smtp.')
              if (tab.id === 'bank')     return k.startsWith('bank.')
              return !k.startsWith('payment.') && !k.startsWith('email.') && !k.startsWith('bank.')
            }) && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ─────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-700 mb-4">🏪 Store Information</h2>
            <Field label="Marketplace Name"  k="site.name" />
            <Field label="Tagline"           k="site.tagline" />
            <Field label="Support Email"     k="site.email"  type="email" />
            <Field label="Support Phone"     k="site.phone" />
            <Field label="Currency Symbol"   k="site.currency_symbol" placeholder="₦" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-700 mb-4">🏪 Vendor Settings</h2>
            <Toggle label="Allow Vendor Registration" k="vendor.registration.open" desc="Let new vendors apply to sell" />
            <Toggle label="Auto-Approve Vendors"      k="vendor.auto_approve"      desc="Skip manual vendor review" />
            <Toggle label="Auto-Approve Products"     k="product.auto_approve"     desc="Skip manual product review" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-700 mb-4">💸 Payout Settings</h2>
            <Field label="Minimum Payout (₦)" k="payout.min_amount"     type="number" hint="Vendors must have at least this amount to request payout" />
            <Field label="Clearing Period"     k="payout.clearing_days"  type="number" hint="Days after delivery before earnings are released" />
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Payout Schedule</label>
              <select value={settings['payout.schedule'] || 'weekly'} onChange={e => set('payout.schedule', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Every Monday)</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="manual">Manual (Admin Triggered)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-700 mb-4">📱 Social & Contact</h2>
            <Field label="WhatsApp Support Number" k="social.whatsapp" />
            <Field label="Instagram Handle"        k="social.instagram" />
            <Field label="Facebook Page URL"       k="social.facebook" />
            <Field label="Twitter/X Handle"        k="social.twitter" />
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {/* Paystack */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">P</div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Paystack</h2>
                <p className="text-xs text-gray-400">Primary payment provider — card, bank transfer, USSD</p>
              </div>
              <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noopener"
                className="ml-auto text-xs text-blue-600 hover:underline font-semibold">
                Get keys ↗
              </a>
            </div>
            <SectionHint text="Keys are encrypted before being stored in the database. The secret key is never sent back to the browser after saving — you'll only see a '✓ Set' badge confirming it exists. To update a key, just type a new value and save." />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Secret Key"
                k="payment.paystack.secret_key"
                placeholder="sk_live_xxxxxxxxxxxxxxx"
                hint="Starts with sk_live_ for production or sk_test_ for testing"
              />
              <Field
                label="Public Key"
                k="payment.paystack.public_key"
                placeholder="pk_live_xxxxxxxxxxxxxxx"
                hint="Starts with pk_live_ for production or pk_test_ for testing"
              />
            </div>
            <Field
              label="Webhook Secret"
              k="payment.paystack.webhook_secret"
              hint="Found in Paystack Dashboard → Settings → API Keys & Webhooks → Webhook section"
              placeholder="Your Paystack webhook secret"
            />
            <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">Webhook URL to register in Paystack</p>
              <code className="text-xs text-blue-600 font-mono">
                {(typeof window !== 'undefined' ? window.location.origin : 'https://ecove.com.ng')}/api/webhooks/paystack
              </code>
            </div>
          </div>

          {/* Flutterwave */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xs">F</div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Flutterwave</h2>
                <p className="text-xs text-gray-400">Optional secondary payment provider</p>
              </div>
              <a href="https://dashboard.flutterwave.com/dashboard/settings/apis" target="_blank" rel="noopener"
                className="ml-auto text-xs text-orange-600 hover:underline font-semibold">
                Get keys ↗
              </a>
            </div>
            <SectionHint text="Leave blank to disable Flutterwave. Customers will only see Paystack on checkout. Same encryption applies — secrets are never returned to the browser." />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Secret Key"
                k="payment.flutterwave.secret_key"
                placeholder="FLWSECK_LIVE-xxxxxxxxxxxx"
                hint="Starts with FLWSECK_LIVE- for production"
              />
              <Field
                label="Public Key"
                k="payment.flutterwave.public_key"
                placeholder="FLWPUBK_LIVE-xxxxxxxxxxxx"
                hint="Starts with FLWPUBK_LIVE- for production"
              />
            </div>
            <Field
              label="Webhook Secret Hash"
              k="payment.flutterwave.webhook_secret"
              hint="The secret hash you set in Flutterwave Dashboard → Settings → Webhooks"
              placeholder="Your custom webhook secret hash"
            />
            <div className="mt-2 p-3 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 mb-1">Webhook URL to register in Flutterwave</p>
              <code className="text-xs text-orange-600 font-mono">
                {(typeof window !== 'undefined' ? window.location.origin : 'https://ecove.com.ng')}/api/webhooks/flutterwave
              </code>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL TAB ──────────────────────────────────────── */}
      {activeTab === 'email' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-900 mb-1">📧 SMTP Email Settings</h2>
            <SectionHint text="These settings control all transactional emails — order confirmations, vendor approvals, password resets, and more. Changes take effect immediately without restarting the server. Use Hostinger mail, Zoho, or Gmail app password for production." />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="SMTP Host"
                k="email.smtp.host"
                placeholder="smtp.hostinger.com"
                hint="Your email provider's SMTP server"
              />
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">SMTP Port</label>
                <select
                  value={settings['email.smtp.port'] || '465'}
                  onChange={e => {
                    set('email.smtp.port', e.target.value)
                    set('email.smtp.secure', e.target.value === '465' ? 'true' : 'false')
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 ${
                    changed['email.smtp.port'] ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <option value="465">465 (SSL — recommended)</option>
                  <option value="587">587 (TLS / STARTTLS)</option>
                  <option value="2525">2525 (Mailtrap testing)</option>
                  <option value="25">25 (rarely works on VPS)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Changing port auto-adjusts SSL setting</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="SMTP Username"
                k="email.smtp.user"
                placeholder="noreply@ecove.com.ng"
                hint="Usually the same as your email address"
              />
              <Field
                label="SMTP Password"
                k="email.smtp.pass"
                hint="Your email account password or app password"
                placeholder="Your SMTP password"
              />
            </div>
            <Field
              label="From Name & Address"
              k="email.from"
              placeholder='Ecove Marketplace <noreply@ecove.com.ng>'
              hint='Format: Display Name <email@domain.com>'
            />
            <Field
              label="Admin Alert Email"
              k="site.email"
              type="email"
              placeholder="admin@ecove.com.ng"
              hint="Receives admin notifications and alerts"
            />
          </div>

          {/* Test email */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-900 mb-1">🧪 Test Your Email Settings</h2>
            <p className="text-xs text-gray-400 mb-4">
              Save your settings first, then send a test email to confirm everything works.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={sendTest}
                disabled={!testEmailTo || testingEmail || hasChanges}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {testingEmail ? 'Sending…' : 'Send Test'}
              </button>
            </div>
            {hasChanges && (
              <p className="text-xs text-amber-600 mt-2">⚠️ Save your changes before testing</p>
            )}

            <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">Common SMTP settings by provider:</p>
              <table className="text-xs w-full">
                <thead><tr className="text-gray-400"><th className="text-left pb-1">Provider</th><th className="text-left pb-1">Host</th><th className="text-left pb-1">Port</th></tr></thead>
                <tbody className="text-gray-600">
                  <tr><td className="py-0.5 pr-4 font-medium">Hostinger</td><td className="pr-4">smtp.hostinger.com</td><td>465</td></tr>
                  <tr><td className="py-0.5 pr-4 font-medium">Zoho Mail</td><td className="pr-4">smtp.zoho.com</td><td>465</td></tr>
                  <tr><td className="py-0.5 pr-4 font-medium">Gmail</td><td className="pr-4">smtp.gmail.com</td><td>587</td></tr>
                  <tr><td className="py-0.5 pr-4 font-medium">Mailtrap (test)</td><td className="pr-4">sandbox.smtp.mailtrap.io</td><td>2525</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BANK TAB ───────────────────────────────────────── */}
      {activeTab === 'bank' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-900 mb-1">🏦 Company Bank Account</h2>
            <SectionHint text="This is the account displayed to vendors and customers for manual bank transfers. It is shown on invoices and payout pages. The account number is stored encrypted." />
            <Field label="Bank Name"         k="bank.name"           placeholder="Access Bank" />
            <Field label="Account Number"    k="bank.account_number" placeholder="0123456789" hint="Stored encrypted — only shows ✓ Set after saving" />
            <Field label="Account Name"      k="bank.account_name"   placeholder="Ecove Technologies Ltd" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-sm text-gray-900 mb-1">📋 Vendor Payout Instructions</h2>
            <SectionHint text="This message is shown to vendors when they request a payout. Use it to explain your transfer process and timeline." />
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Payout Instructions</label>
              <textarea
                value={settings['payout.instructions'] || ''}
                onChange={e => set('payout.instructions', e.target.value)}
                rows={4}
                placeholder="e.g. Payouts are processed every Monday. Ensure your bank details are correct before requesting. Contact support if payment is not received within 3 business days."
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none ${
                  changed['payout.instructions'] ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Save bar ────────────────────────────────────────── */}
      {hasChanges && (
        <div className="mt-5 p-4 rounded-xl flex items-center justify-between"
          style={{ background: '#fff4e6', border: '1px solid #f68b1f' }}>
          <p className="text-sm font-semibold text-orange-700">
            You have unsaved changes
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setSettings(original); setChanged({}) }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Discard
            </button>
            <button
              onClick={() => {
                const toSave = Object.fromEntries(Object.keys(changed).map(k => [k, settings[k]]))
                save.mutate(toSave)
              }}
              disabled={save.isPending}
              className="px-5 py-2 rounded-xl text-white font-bold text-sm disabled:opacity-60 bg-orange-500 hover:bg-orange-600"
            >
              {save.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
