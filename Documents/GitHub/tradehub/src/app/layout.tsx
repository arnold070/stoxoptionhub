import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoxOptionHub | Institutional Grade Trading Platform",
  description: "StoxOptionHub gives you institutional-grade copy trading, mentorship, and portfolio management — all in one platform.",
  manifest: "/manifest.json",
  openGraph: {
    title: "StoxOptionHub",
    description: "Institutional-grade copy trading, mentorship, and portfolio management.",
    siteName: "StoxOptionHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoxOptionHub",
    description: "Institutional-grade copy trading, mentorship, and portfolio management.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
