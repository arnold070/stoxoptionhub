import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Zap,
  BarChart2,
  CheckCircle,
  Clock,
  Globe,
  BookOpen,
  Bell,
  Wallet,
} from "lucide-react";
import AnimatedStats from "@/components/marketing/AnimatedStats";
import CryptoWidget from "@/components/marketing/CryptoWidget";
import TestimonialCarousel from "@/components/marketing/TestimonialCarousel";
import FAQAccordion from "@/components/marketing/FAQAccordion";

export const metadata: Metadata = {
  title: "Professional Copy Trading & Investment Platform",
  description:
    "Trade smarter with StoxOptionHub. Access structured copy trading plans, professional mentorship, and transparent portfolio management — all in one institutional-grade platform.",
};

/* ── Mini SVG chart decoration ── */
function HeroChart() {
  const points = [20, 38, 30, 52, 44, 68, 58, 74, 70, 88, 80, 96];
  const w = 320;
  const h = 100;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 12) - 6}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0b429" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f0b429" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#hg)" />
      <polyline points={pts} fill="none" stroke="#f0b429" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 12) - 6;
        return i === points.length - 1 ? <circle key={i} cx={x} cy={y} r="4" fill="#f0b429" /> : null;
      })}
    </svg>
  );
}

const plans = [
  {
    name: "Starter Growth",
    duration: "30 Days",
    strategy: "Conservative Blend — diversified low-volatility assets",
    risk: "Low",
    riskColor: "text-[#22c55e]",
    riskBg: "bg-[#22c55e]/10 border-[#22c55e]/20",
    minAmount: "$100",
    perks: ["Diversified allocation", "Daily strategy report", "24/7 support"],
  },
  {
    name: "Alpha Momentum",
    duration: "60 Days",
    strategy: "Momentum Trading — trend-following across major crypto pairs",
    risk: "Medium",
    riskColor: "text-[#f0b429]",
    riskBg: "bg-[#f0b429]/10 border-[#f0b429]/20",
    minAmount: "$500",
    perks: ["Priority execution", "Weekly analyst briefing", "Mentorship access"],
    featured: true,
  },
  {
    name: "Institutional Edge",
    duration: "90 Days",
    strategy: "Multi-Asset Arbitrage — advanced cross-market strategy",
    risk: "High",
    riskColor: "text-[#ef4444]",
    riskBg: "bg-[#ef4444]/10 border-[#ef4444]/20",
    minAmount: "$2,000",
    perks: ["Full portfolio analytics", "Dedicated account manager", "VIP mentorship"],
  },
];

const features = [
  { icon: Shield, title: "Secure Wallet System", desc: "Every deposit is manually reviewed and approved by our compliance team before funds are credited to your account." },
  { icon: CheckCircle, title: "Manual Deposit Verification", desc: "Crypto deposits are verified on-chain before approval, eliminating fraud and ensuring only legitimate transactions are processed." },
  { icon: TrendingUp, title: "Copy Trading Execution", desc: "Your investment is allocated to structured strategies that mirror professional trading activity with full transparency." },
  { icon: BarChart2, title: "Automated Investment Lifecycle", desc: "Plans run for their full duration automatically. Returns are credited upon completion with no manual action required." },
  { icon: Bell, title: "Real-Time Notifications", desc: "Get notified at every step — deposit submitted, approved, investment started, and completed." },
  { icon: Globe, title: "Multi-Currency Support", desc: "Deposit via major cryptocurrencies. Your wallet balance is maintained in USDT for consistent, transparent accounting." },
  { icon: BookOpen, title: "Mentorship Integration", desc: "Access structured learning programs alongside your trading activity to develop real market skills over time." },
  { icon: Wallet, title: "Full Transaction History", desc: "Every financial action is recorded in an immutable ledger. Full audit history available in your dashboard at all times." },
];

const faqs = [
  { q: "How do I fund my wallet?", a: "Submit a crypto deposit with your transaction hash and network. Our admin team reviews and approves it, after which your wallet is credited. This typically takes 1–24 hours depending on network confirmation times." },
  { q: "What is copy trading?", a: "Copy trading means your investment capital is allocated to structured strategies managed by professional traders. The strategy's activity is mirrored for your position, giving you market exposure without active trading." },
  { q: "Are returns guaranteed?", a: "No. All investment plans are market-dependent. Returns vary based on market conditions, strategy performance, and the duration of your plan. Past strategy performance does not guarantee future results." },
  { q: "How long do investment plans last?", a: "Plans range from 30 to 90 days depending on the chosen strategy. Returns (if any) are credited to your wallet automatically upon plan completion." },
  { q: "Can I withdraw at any time?", a: "Withdrawal requests can be submitted at any time from your wallet. Active investment capital is locked for the plan duration. Available wallet balance can be withdrawn after admin review." },
  { q: "What is the mentorship program?", a: "Mentorship is a structured educational offering with learning tracks, live sessions, market analysis, and risk management training. It is an educational program, not a trading signal or guaranteed profit service." },
];

/* ─────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8">
        {/* Background grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"
          aria-hidden="true"
        />
        {/* Primary radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#f0b429]/6 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        {/* Secondary accent glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#6366f1]/4 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-6 animate-fade-in-up">
                <Zap size={11} className="text-[#f0b429]" />
                <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">
                  Institutional Grade Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6 animate-fade-in-up animation-delay-100">
                Trade Smarter.{" "}
                <span className="text-[#f0b429]">Learn Faster.</span>
                <br />
                Grow Consistently.
              </h1>

              <p className="text-[16px] sm:text-[18px] text-[#888] leading-relaxed mb-6 max-w-lg animate-fade-in-up animation-delay-200">
                Access structured copy trading strategies, transparent investment plans, and professional mentorship — all within a single institutional-grade platform built for serious investors worldwide.
              </p>

              <p className="text-[12px] text-[#555] mb-8 max-w-md leading-relaxed animate-fade-in-up animation-delay-300">
                <span className="text-[#f0b429]">Risk Notice:</span> Trading and investment products carry significant market risk. Capital is at risk and returns are not guaranteed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animation-delay-300">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
                >
                  Get Started <ArrowRight size={15} />
                </Link>
                <Link
                  href="/investment-plans"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[14px] rounded-xl transition-all"
                >
                  View Plans
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[#1a1a1a] animate-fade-in-up animation-delay-400">
                {[
                  { value: "5,000+", label: "Active Members" },
                  { value: "40+", label: "Countries" },
                  { value: "24/7", label: "Admin Support" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-[20px] font-bold text-white">{value}</div>
                    <div className="text-[11px] text-[#555] uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: glassmorphism chart card */}
            <div className="relative animate-fade-in-up animation-delay-200">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-[#f0b429]/5 rounded-3xl blur-3xl scale-110 pointer-events-none" aria-hidden="true" />

              <div className="relative glass bg-[#111]/80 border border-[#f0b429]/10 rounded-2xl p-6 shadow-2xl">
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[12px] text-[#555] uppercase tracking-wider mb-1">Portfolio Overview</div>
                    <div className="text-[28px] font-bold text-white">$24,830.00</div>
                    <div className="text-[13px] text-[#22c55e] font-semibold mt-0.5">
                      +12.4% this period
                      <span className="text-[#444] font-normal text-[10px] ml-2">market-dependent</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-[#f0b429]/10 rounded-xl flex items-center justify-center animate-glow-pulse">
                    <TrendingUp size={18} className="text-[#f0b429]" />
                  </div>
                </div>

                {/* Chart */}
                <div className="h-24 mb-4">
                  <HeroChart />
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Active Plans", value: "2" },
                    { label: "Available", value: "$4,830" },
                    { label: "Strategy", value: "Alpha" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</div>
                      <div className="text-[14px] font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="flex items-center gap-2 p-3 bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
                  <span className="text-[12px] text-[#22c55e]">All systems operational — deposits processing normally</span>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -bottom-4 -left-4 glass bg-[#111]/90 border border-[#f0b429]/15 rounded-xl p-3 shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f0b429]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Shield size={14} className="text-[#f0b429]" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Deposit Approved</div>
                  <div className="text-[10px] text-[#555]">+$1,000 USDT credited</div>
                </div>
              </div>

              {/* Floating market card */}
              <div className="absolute -top-4 -right-4 glass bg-[#111]/90 border border-[#22c55e]/15 rounded-xl p-3 shadow-xl hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 bg-[#22c55e]/10 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp size={14} className="text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">BTC +2.41%</div>
                  <div className="text-[10px] text-[#555]">Live market data</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ANIMATED STATS
      ═══════════════════════════════════════════════ */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <AnimatedStats />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MARKET OVERVIEW
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="market-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
                <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Live Market Data</span>
              </div>
              <h2 id="market-heading" className="text-2xl sm:text-3xl font-bold text-white">
                Market Overview
              </h2>
            </div>
            <p className="text-[12px] text-[#444] max-w-xs text-right hidden sm:block leading-relaxed">
              Prices shown for informational purposes only. Not investment advice.
            </p>
          </div>
          <CryptoWidget />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRUST / VALUE PROPOSITION ICONS
      ═══════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Shield, label: "Secure Wallet", sub: "Manual approval" },
              { icon: CheckCircle, label: "Verified Deposits", sub: "On-chain review" },
              { icon: TrendingUp, label: "Copy Trading", sub: "Strategy-driven" },
              { icon: BookOpen, label: "Mentorship", sub: "Expert-led" },
              { icon: BarChart2, label: "Dashboard", sub: "Real-time data" },
              { icon: Globe, label: "Global Access", sub: "40+ countries" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-[#111] transition-colors">
                <div className="w-11 h-11 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex items-center justify-center">
                  <Icon size={18} className="text-[#f0b429]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">{label}</div>
                  <div className="text-[11px] text-[#555]">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Clock size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Lifecycle</span>
            </div>
            <h2 id="hiw-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-[15px] text-[#555] max-w-xl mx-auto">
              From account creation to payout — every step is transparent, audited, and fully automated.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Create Account", desc: "Register and verify your email to gain access to the full platform." },
              { step: "02", title: "Fund Your Wallet", desc: "Submit a crypto deposit with your TXID, network, and amount for review." },
              { step: "03", title: "Admin Approval", desc: "Our compliance team reviews and approves your deposit on-chain before crediting." },
              { step: "04", title: "Wallet Credited", desc: "Approved funds appear in your wallet balance, ready for investment allocation." },
              { step: "05", title: "Select a Plan", desc: "Browse copy trading investment plans and allocate your balance to a strategy." },
              { step: "06", title: "Plan Runs", desc: "The system tracks your plan duration automatically — no action needed." },
              { step: "07", title: "Returns Credited", desc: "Upon plan maturity, any returns (subject to market performance) are credited to your wallet." },
              { step: "08", title: "Withdraw Funds", desc: "Request a withdrawal anytime. Admin reviews and processes your request securely." },
            ].map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="relative bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/20 transition-all group"
              >
                <div className="text-[32px] font-bold text-[#1e1e1e] group-hover:text-[#f0b429]/10 mb-3 leading-none select-none transition-colors">{step}</div>
                <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">{desc}</p>
                {i < 7 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-[#2a2a2a]" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-[#f0b429] hover:opacity-80 font-semibold text-[14px] transition-opacity"
            >
              View full lifecycle breakdown <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COPY TRADING SECTION
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]" aria-labelledby="ct-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-5">
                <TrendingUp size={11} className="text-[#f0b429]" />
                <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Core Product</span>
              </div>
              <h2 id="ct-heading" className="text-3xl sm:text-4xl font-bold text-white mb-5">
                Copy Trading —<br />
                <span className="text-[#f0b429]">Strategy-Driven Investing</span>
              </h2>
              <p className="text-[15px] text-[#888] leading-relaxed mb-6">
                Copy trading on StoxOptionHub means your capital is allocated to professionally managed strategies. The strategy&apos;s activity mirrors real market positions, giving your investment exposure to systematic trading logic.
              </p>
              <div className="p-4 bg-[#f0b429]/5 border border-[#f0b429]/15 rounded-xl mb-6">
                <p className="text-[13px] text-[#888] leading-relaxed">
                  <span className="text-[#f0b429] font-semibold">Market Notice:</span> Copy trading results depend entirely on market conditions. Performance shown on any plan is historical and does not guarantee future results. All capital is subject to market risk.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Strategies managed by experienced professional traders",
                  "Full investment lifecycle tracked and logged automatically",
                  "Plan duration fixed — strategy runs until maturity",
                  "Complete transparency on every allocation via your dashboard",
                  "Risk level clearly marked on every available plan",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] text-[#888]">
                    <CheckCircle size={14} className="text-[#f0b429] mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/copy-trading"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[13px] rounded-xl transition-colors hover:shadow-[0_0_20px_rgba(240,180,41,0.25)]"
              >
                Learn More <ArrowRight size={13} />
              </Link>
            </div>

            {/* Strategy cards */}
            <div className="space-y-3">
              <StrategyCard name="Momentum Alpha" tier="GOLD" tierClass="text-[#f0b429]" allocated="$18,500" barLabel="72%" barWidthClass="w-[72%]" barClass="bg-[#f0b429]" />
              <StrategyCard name="Conservative Blend" tier="SILVER" tierClass="text-[#888]" allocated="$7,200" barLabel="45%" barWidthClass="w-[45%]" barClass="bg-[#888]" />
              <StrategyCard name="Arbitrage Plus" tier="PLATINUM" tierClass="text-[#8b5cf6]" allocated="$32,000" barLabel="88%" barWidthClass="w-[88%]" barClass="bg-[#8b5cf6]" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          INVESTMENT PLANS PREVIEW
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" aria-labelledby="plans-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <BarChart2 size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Investment Plans</span>
            </div>
            <h2 id="plans-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Structured Copy Trading Plans
            </h2>
            <p className="text-[15px] text-[#555] max-w-xl mx-auto">
              Choose a strategy-aligned plan based on your risk tolerance and investment horizon. Returns are market-dependent and not guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(({ name, duration, strategy, risk, riskColor, riskBg, minAmount, perks, featured }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                  featured
                    ? "bg-[#111] border-2 border-[#f0b429]/40 shadow-[0_0_40px_rgba(240,180,41,0.08)] hover:shadow-[0_0_50px_rgba(240,180,41,0.12)]"
                    : "bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a]"
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#f0b429] text-black text-[10px] font-bold rounded-full uppercase tracking-wider shadow-[0_0_12px_rgba(240,180,41,0.5)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-[18px] font-bold text-white mb-1">{name}</h3>
                  <div className="text-[12px] text-[#555] leading-relaxed">{strategy}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Duration</div>
                    <div className="text-[14px] font-bold text-white">{duration}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Minimum</div>
                    <div className="text-[14px] font-bold text-white">{minAmount}</div>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${riskBg} mb-4 self-start`}>
                  <span className={`text-[11px] font-semibold ${riskColor}`}>Risk Level: {risk}</span>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-[12px] text-[#666]">
                      <CheckCircle size={11} className="text-[#f0b429] shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="p-2.5 bg-[#1a1a1a] rounded-lg mb-5">
                  <p className="text-[11px] text-[#555] text-center">Market-dependent returns. Capital not guaranteed.</p>
                </div>

                <Link
                  href="/register"
                  className={`mt-auto w-full py-3 rounded-xl text-[13px] font-bold text-center transition-all ${
                    featured
                      ? "bg-[#f0b429] hover:bg-[#e0a424] text-black hover:shadow-[0_0_16px_rgba(240,180,41,0.4)]"
                      : "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]"
                  }`}
                >
                  Start Copy Trading
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-[#444] mt-8 max-w-2xl mx-auto">
            All investment plans carry market risk. The value of investments can go up or down. Capital is not guaranteed. Past strategy performance is not indicative of future results.
          </p>

          <div className="text-center mt-6">
            <Link
              href="/investment-plans"
              className="inline-flex items-center gap-2 text-[#f0b429] hover:opacity-80 font-semibold text-[14px]"
            >
              View all plans <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MENTORSHIP SECTION
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]" aria-labelledby="mentorship-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Learning track grid */}
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-3">
              {[
                { track: "Beginner Track", modules: "8 modules", icon: BookOpen, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
                { track: "Technical Analysis", modules: "12 modules", icon: BarChart2, color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
                { track: "Risk Management", modules: "6 modules", icon: Shield, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
                { track: "Portfolio Building", modules: "10 modules", icon: TrendingUp, color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
                { track: "Live Q&A Sessions", modules: "Weekly", icon: Users, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
                { track: "Market Analysis", modules: "Bi-weekly", icon: Globe, color: "text-[#888]", bg: "bg-[#888]/10" },
              ].map(({ track, modules, icon: Icon, color, bg }) => (
                <div key={track} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 hover:border-[#2a2a2a] transition-all group">
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div className="text-[13px] font-semibold text-white mb-1">{track}</div>
                  <div className="text-[11px] text-[#555]">{modules}</div>
                </div>
              ))}
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-5">
                <GraduationCapIcon />
                <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Education</span>
              </div>
              <h2 id="mentorship-heading" className="text-3xl sm:text-4xl font-bold text-white mb-5">
                Mentorship Programs —<br />
                <span className="text-[#f0b429]">Built for Real Skill</span>
              </h2>
              <p className="text-[15px] text-[#888] leading-relaxed mb-6">
                Our mentorship system is a structured educational platform, not a signal service. You learn trading frameworks, risk management, and market analysis from experienced practitioners through a progressive curriculum.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Beginner to advanced learning tracks with structured progression",
                  "Live webinars with real-time Q&A from industry professionals",
                  "Risk management and position sizing training",
                  "Portfolio-building strategies and capital allocation frameworks",
                  "Community learning groups for peer discussion and accountability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] text-[#888]">
                    <CheckCircle size={14} className="text-[#f0b429] mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-[#555] mb-6 p-3 bg-[#1a1a1a] rounded-lg">
                Mentorship is an educational offering only. It does not constitute financial advice or guarantee any trading outcome.
              </p>
              <Link
                href="/mentorship"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[13px] rounded-xl transition-colors hover:shadow-[0_0_16px_rgba(240,180,41,0.3)]"
              >
                Join Mentorship Program <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PLATFORM FEATURES
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Zap size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Platform</span>
            </div>
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Institutional Quality
            </h2>
            <p className="text-[15px] text-[#555] max-w-xl mx-auto">
              Every feature is designed with security, transparency, and investor protection at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group"
              >
                <div className="w-10 h-10 bg-[#1a1a1a] group-hover:bg-[#f0b429]/10 border border-[#2a2a2a] rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon size={17} className="text-[#555] group-hover:text-[#f0b429] transition-colors" />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <Users size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Community</span>
            </div>
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What Our Members Say
            </h2>
            <p className="text-[15px] text-[#555] max-w-lg mx-auto">
              Traders and investors from around the world share their experiences with StoxOptionHub.
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[15px] text-[#555]">
              Common questions about the platform, wallet, and investments.
            </p>
          </div>
          <FAQAccordion items={faqs} />
          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-[#f0b429] hover:opacity-80 font-semibold text-[14px]"
            >
              View all FAQs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-10 sm:p-14 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,180,41,0.06)_0%,transparent_70%)] pointer-events-none" aria-hidden="true" />
            {/* Corner glows */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#f0b429]/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#6366f1]/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative">
              <div className="w-14 h-14 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
                <TrendingUp size={24} className="text-[#f0b429]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start Your Investment Journey Today
              </h2>
              <p className="text-[15px] text-[#555] leading-relaxed mb-4 max-w-xl mx-auto">
                Join thousands of investors using StoxOptionHub to access structured copy trading plans and professional mentorship.
              </p>
              <p className="text-[12px] text-[#444] mb-8 max-w-lg mx-auto">
                All investments carry market risk. Capital is not guaranteed. Please review our{" "}
                <Link href="/risk-disclosure" className="text-[#666] underline hover:text-[#888]">Risk Disclosure</Link>{" "}
                before proceeding.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[15px] rounded-xl transition-all hover:shadow-[0_0_24px_rgba(240,180,41,0.35)]"
                >
                  Create Account <ArrowRight size={15} />
                </Link>
                <Link
                  href="/investment-plans"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[15px] rounded-xl transition-all"
                >
                  Explore Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function StrategyCard({
  name, tier, tierClass, allocated, barLabel, barWidthClass, barClass,
}: {
  name: string; tier: string; tierClass: string;
  allocated: string; barLabel: string; barWidthClass: string; barClass: string;
}) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 hover:border-[#2a2a2a] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[14px] font-semibold text-white">{name}</div>
          <div className={`text-[11px] mt-0.5 ${tierClass}`}>{tier} Strategy</div>
        </div>
        <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold rounded uppercase tracking-wider">
          ACTIVE
        </span>
      </div>
      <div className="flex items-center justify-between mb-3 text-[12px]">
        <div>
          <span className="text-[#555]">Allocated: </span>
          <span className="text-white font-semibold">{allocated}</span>
        </div>
        <div className="text-[11px] text-[#444]">Returns: market-dependent</div>
      </div>
      <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barWidthClass} ${barClass}`}
          role="progressbar"
          aria-label={`${name} plan duration: ${barLabel} elapsed`}
        />
      </div>
      <div className="text-[10px] text-[#555] mt-1.5">{barLabel} of plan duration elapsed</div>
    </div>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f0b429]" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
