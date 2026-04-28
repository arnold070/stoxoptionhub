import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vendor Policies – Ecove Marketplace',
  description: 'Rules, commission rates, and policies for selling on Ecove Marketplace Nigeria.',
}

export default function VendorPoliciesPage() {
  const commissionRates = [
    { category: 'Phones & Tablets',  rate: '8%' },
    { category: 'Computing',          rate: '8%' },
    { category: 'Electronics',        rate: '8%' },
    { category: 'Fashion',            rate: '15%' },
    { category: 'Beauty & Health',    rate: '18%' },
    { category: 'Baby Products',      rate: '10%' },
    { category: 'Sports & Outdoors',  rate: '10%' },
    { category: 'Home & Kitchen',     rate: '10%' },
    { category: 'Groceries',          rate: '5%' },
    { category: 'Automotive',         rate: '10%' },
    { category: 'Gaming',             rate: '10%' },
    { category: 'Books & Education',  rate: '10%' },
    { category: 'All other categories', rate: '10%' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-orange-500 hover:underline">← Back to Ecove</Link>
      </div>

      <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Vendor Policies</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 1, 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed text-sm">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Eligibility</h2>
          <p>To sell on Ecove you must be a registered Nigerian business or individual with a valid bank account. All vendor applications are reviewed within 24–48 hours. Ecove reserves the right to approve or reject any application at its discretion.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Listing Requirements</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>All product listings must be accurate with clear photos</li>
            <li>Prices must include all applicable taxes</li>
            <li>Stock levels must be kept up to date</li>
            <li>Products must comply with Nigerian law and consumer protection regulations</li>
            <li>Counterfeit, recalled, or prohibited items are strictly banned</li>
            <li>All listings require admin approval before going live</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Prohibited Items</h2>
          <p className="mb-2">The following may not be listed on Ecove under any circumstances:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Counterfeit or replica goods</li>
            <li>Weapons, ammunition, or explosives</li>
            <li>Illegal drugs or controlled substances</li>
            <li>Stolen goods</li>
            <li>Adult content or services</li>
            <li>Animals or animal parts</li>
            <li>Currency, financial instruments, or lottery tickets</li>
          </ul>
        </section>

        <section id="commission">
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Commission Rates</h2>
          <p className="mb-4">Ecove charges a commission on each successful sale. Commission is deducted before vendor earnings are credited to your balance.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border border-gray-200">Category</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border border-gray-200">Commission Rate</th>
                </tr>
              </thead>
              <tbody>
                {commissionRates.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2.5 border border-gray-200">{row.category}</td>
                    <td className="px-4 py-2.5 border border-gray-200 font-semibold" style={{ color: '#f68b1f' }}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Payouts</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Earnings clear <strong>7 days after confirmed delivery</strong></li>
            <li>Minimum payout amount: <strong>₦5,000</strong></li>
            <li>Payouts are processed within <strong>3–5 business days</strong> of admin approval</li>
            <li>You must have a valid Nigerian bank account to receive payouts</li>
            <li>Ecove does not charge payout fees</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Order Fulfillment</h2>
          <p>Vendors must ship orders within the handling time specified on their listings. Orders must be marked as shipped with a valid tracking number within 3 business days of payment confirmation. Failure to fulfill orders promptly will affect your store rating and may result in account suspension.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Returns & Disputes</h2>
          <p>Vendors must accept returns for items that are defective, damaged, or significantly different from the listing. Vendors are responsible for the cost of return shipping in such cases. Ecove will mediate disputes between buyers and vendors and our decision is final.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Account Suspension</h2>
          <p>Ecove may suspend or permanently ban vendor accounts for: listing counterfeit goods, excessive cancellations or late shipments, poor customer ratings, policy violations, or fraud. Funds in suspended accounts are held pending investigation.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Contact</h2>
          <p>For vendor support contact <a href="mailto:vendors@ecove.com.ng" className="text-orange-500 hover:underline">vendors@ecove.com.ng</a>. Business hours: Monday–Friday 9am–6pm WAT.</p>
        </section>

      </div>
    </div>
  )
}
