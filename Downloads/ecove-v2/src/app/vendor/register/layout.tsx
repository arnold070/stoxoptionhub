import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Sell on Ecove – Apply as Vendor',
  description: "Start selling on Nigeria's fastest-growing marketplace. Apply to become an Ecove vendor today.",
}
export default function VendorRegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
