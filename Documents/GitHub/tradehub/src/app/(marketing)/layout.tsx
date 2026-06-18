import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import MarketTicker from "@/components/marketing/MarketTicker";
import { LiveChatWidget } from "@/components/LiveChatWidget";
import { getPublicSiteConfig } from "@/lib/actions/admin";

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

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cfg = await getPublicSiteConfig([
    "livechat_enabled",
    "livechat_provider",
    "livechat_widget_id",
    "livechat_custom_code",
  ]);

  const chatEnabled = cfg.livechat_enabled === "true";
  const chatProvider = cfg.livechat_provider || "tawk";
  const chatWidgetId = cfg.livechat_widget_id || "";
  const chatCustomCode = cfg.livechat_custom_code || "";

  return (
    <>
      <PublicNav />
      <MarketTicker />
      <main>{children}</main>
      <PublicFooter />
      {chatEnabled && chatWidgetId && (
        <LiveChatWidget
          provider={chatProvider}
          widgetId={chatWidgetId}
          customCode={chatCustomCode}
        />
      )}
    </>
  );
}
