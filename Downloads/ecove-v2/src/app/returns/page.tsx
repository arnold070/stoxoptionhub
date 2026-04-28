import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy – Ecove Marketplace',
  description: 'Ecove Marketplace returns, refunds, and dispute resolution policy.',
}

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-orange-500 hover:underline">← Back to Ecove</Link>
      </div>

      <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Returns &amp; Refunds Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 1, 2025</p>

      <div className="space-y-6 text-gray-700 leading-relaxed text-sm">

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="font-semibold text-orange-800">Return Window: 7 days from delivery</p>
          <p className="text-orange-700 mt-1">Items must be returned within 7 days of confirmed delivery to qualify for a refund.</p>
        </div>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Items Eligible for Return</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Item received is significantly different from the product description</li>
            <li>Item is defective or damaged on arrival</li>
            <li>Wrong item delivered</li>
            <li>Item is counterfeit or not as advertised</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Items NOT Eligible for Return</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Change of mind after purchase</li>
            <li>Items that have been used, washed, or altered</li>
            <li>Perishable goods (food, flowers, etc.)</li>
            <li>Downloadable software or digital products</li>
            <li>Items without original packaging</li>
            <li>Intimate or sanitary goods</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. How to Request a Return</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Log in to your account and go to <strong>My Orders</strong></li>
            <li>Select the order and click <strong>Request Return</strong></li>
            <li>Describe the issue and upload photos of the item</li>
            <li>Our team will review your request within 2 business days</li>
            <li>If approved, you will receive return shipping instructions</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Refund Process</h2>
          <p>Once we confirm receipt and inspection of the returned item, refunds are processed within <strong>5–10 business days</strong> to your original payment method. For bank transfers, processing may take additional 2–3 business days depending on your bank.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Vendor Responsibility</h2>
          <p>Vendors are responsible for the accuracy of their product listings and the quality of items shipped. Vendors who receive excessive return requests or complaints are subject to account review and possible suspension.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Contact</h2>
          <p>For return disputes contact us at <a href="mailto:support@ecove.com.ng" className="text-orange-500 hover:underline">support@ecove.com.ng</a>. We aim to respond within 24 hours on business days.</p>
        </section>

      </div>
    </div>
  )
}
