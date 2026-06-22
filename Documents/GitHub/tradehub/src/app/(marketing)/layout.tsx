import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import MarketTicker from "@/components/marketing/MarketTicker";

export const metadata: Metadata = {
  metadataBase: new URL("https://stoxoptionhub.com"),
  title: {
    default: "StoxOptionHub | Professional Copy Trading & Investment Platform",
    template: "%s | StoxOptionHub",
  },
  description:
    "StoxOptionHub is an institutional-grade copy trading platform offering structured investment plans, professional mentorship, and transparent portfolio management.",
  openGraph: {
    siteName: "StoxOptionHub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      <MarketTicker />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
