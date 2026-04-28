// This layout provides no auth guard — vendor/login and vendor/register are public.
// Auth protection is applied at vendor/dashboard/layout.tsx
export default function VendorRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
