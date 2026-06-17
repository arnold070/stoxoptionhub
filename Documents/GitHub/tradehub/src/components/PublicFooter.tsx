"use client";

import Link from "next/link";
import { Zap, Send, Mail } from "lucide-react";

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

function YoutubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const footerLinks = {
  Platform: [
    { href: "/investment-plans", label: "Investment Plans" },
    { href: "/copy-trading", label: "Copy Trading" },
    { href: "/mentorship", label: "Mentorship" },
    { href: "/how-it-works", label: "How It Works" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/risk-disclosure", label: "Risk Disclosure" },
    { href: "/cookies", label: "Cookie Policy" },
  ],
};

const socials = [
  { Icon: XIcon, label: "Twitter / X", href: "#" },
  { Icon: YoutubeIcon, label: "YouTube", href: "#" },
  { Icon: Send, label: "Telegram", href: "#" },
  { Icon: Mail, label: "Email", href: "mailto:support@stoxoptionhub.com" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[#0d0d0d] border-t border-[#1e1e1e]">
      {/* Risk disclaimer bar */}
      <div className="bg-[#111] border-b border-[#1e1e1e] py-3 px-4">
        <p className="text-center text-[11px] text-[#555] max-w-4xl mx-auto leading-relaxed">
          <span className="text-[#f0b429] font-semibold">Risk Warning:</span> Trading financial instruments involves
          significant risk and may not be suitable for all investors. Past performance is not indicative of future
          results. Capital is at risk. Please read our{" "}
          <Link href="/risk-disclosure" className="text-[#888] underline hover:text-white transition-colors">
            Risk Disclosure
          </Link>{" "}
          before investing.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand + newsletter */}
          <div className="lg:col-span-2">
            <Link href="/home" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 bg-[#1a1a1a] group-hover:bg-[#f0b429]/10 rounded-xl border border-[#2a2a2a] group-hover:border-[#f0b429]/30 flex items-center justify-center shrink-0 transition-all">
                <Zap size={17} className="text-[#f0b429]" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-white">StoxOptionHub</div>
                <div className="text-[9px] text-[#444] uppercase tracking-widest">Institutional Grade</div>
              </div>
            </Link>

            <p className="text-[13px] text-[#555] leading-relaxed max-w-xs mb-6">
              A professional copy trading and investment platform built for serious traders seeking structured,
              strategy-driven portfolio management and mentorship.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold mb-2">Market Updates</p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2"
                aria-label="Subscribe to market updates"
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] focus:outline-none focus:border-[#f0b429]/40 transition-colors"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="shrink-0 px-3 py-2 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[12px] font-bold rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-[10px] text-[#444] mt-1.5">No spam. Unsubscribe anytime.</p>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-[#1a1a1a] hover:bg-[#f0b429]/10 border border-[#2a2a2a] hover:border-[#f0b429]/30 rounded-lg flex items-center justify-center text-[#555] hover:text-[#f0b429] transition-all"
                >
                  <Icon size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-[11px] font-semibold text-[#f0b429] uppercase tracking-widest mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-[#555] hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#444]">
            &copy; {new Date().getFullYear()} StoxOptionHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[11px] text-[#444]">Platform Operational</span>
            </div>
            <span className="text-[#2a2a2a]">|</span>
            <Link href="/contact" className="text-[11px] text-[#444] hover:text-white transition-colors">
              support@stoxoptionhub.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
