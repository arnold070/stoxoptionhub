import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy – Ecove Marketplace',
  description: 'How Ecove Marketplace collects, uses and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-orange-500 hover:underline">← Back to Ecove</Link>
      </div>

      <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 1, 2025</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
          <p>When you use Ecove Marketplace we collect information you provide directly, including your name, email address, phone number, delivery address, and payment information. We also collect information about your activity on the platform such as products viewed, orders placed, and searches made.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p>We use your information to process orders and payments, send order confirmations and delivery updates, provide customer support, improve our marketplace, and communicate relevant promotions. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Information Shared with Vendors</h2>
          <p>When you place an order, your name, delivery address, and phone number are shared with the relevant vendor solely for the purpose of fulfilling your order. Vendors are prohibited from using your information for any other purpose.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Payment Security</h2>
          <p>All payments are processed by Paystack and Flutterwave, which are PCI-DSS compliant payment processors. Ecove does not store your card details. All transactions are encrypted using industry-standard SSL technology.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies</h2>
          <p>We use cookies to keep you signed in, remember your cart, and understand how you use our platform. You can disable cookies in your browser settings but some features may not work correctly.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Retention</h2>
          <p>We retain your account information for as long as your account is active. Order records are retained for seven years for legal and tax compliance. You may request deletion of your account by contacting us at privacy@ecove.com.ng.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. You may also object to certain processing of your data. To exercise these rights, contact us at privacy@ecove.com.ng.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Contact</h2>
          <p>For privacy-related questions contact us at <a href="mailto:privacy@ecove.com.ng" className="text-orange-500 hover:underline">privacy@ecove.com.ng</a> or write to: Ecove Marketplace, Lagos, Nigeria.</p>
        </section>

      </div>
    </div>
  )
}
