import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Eye, BarChart2, CheckCircle, AlertTriangle, Users, Zap, Lock, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Copy Trading",
  description:
    "Learn how copy trading works on StoxOptionHub. Strategy-mirrored investments, professional trader management, and complete transparency — with honest market risk disclosure.",
};

const strategies = [
  { name: "Momentum Alpha", tier: "GOLD", tierClass: "text-[#f0b429]", allocated: "$18,500", bar: 72, barClass: "bg-[#f0b429] w-[72%]", label: "Trend-following across major crypto pairs" },
  { name: "Conservative Blend", tier: "SILVER", tierClass: "text-[#888]", allocated: "$7,200", bar: 45, barClass: "bg-[#888] w-[45%]", label: "Diversified low-volatility basket" },
  { name: "Arbitrage Plus", tier: "PLATINUM", tierClass: "text-[#8b5cf6]", allocated: "$32,000", bar: 88, barClass: "bg-[#8b5cf6] w-[88%]", label: "Cross-market arbitrage execution" },
];

export default function CopyTradingPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f0b429]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-6">
              <TrendingUp size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Core Product</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-5">
              Copy Trading on<br />
              <span className="text-[#f0b429]">StoxOptionHub</span>
            </h1>
            <p className="text-[16px] text-[#888] leading-relaxed mb-6">
              Copy trading on StoxOptionHub gives you exposure to professionally managed trading strategies. Your capital is allocated to a defined strategy for a fixed duration, with market-dependent outcomes.
            </p>
            <div className="p-4 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl mb-8 flex gap-3">
              <AlertTriangle size={14} className="text-[#ef4444] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#888] leading-relaxed">
                <span className="text-[#ef4444] font-semibold">Market Risk:</span> Copy trading results are market-dependent. Past performance is not indicative of future results. Capital is at risk and returns are not guaranteed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
              >
                Start Copy Trading <ArrowRight size={14} />
              </Link>
              <Link
                href="/investment-plans"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[14px] rounded-xl transition-all"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Live strategy showcase */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-white">Active Strategies</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[11px] text-[#555]">Live</span>
              </div>
            </div>
            <div className="space-y-3">
              {strategies.map(({ name, tier, tierClass, allocated, barClass, label }) => (
                <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 hover:border-[#2a2a2a] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[14px] font-semibold text-white">{name}</div>
                      <div className={`text-[11px] mt-0.5 ${tierClass}`}>{tier} Strategy</div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold rounded uppercase tracking-wider">ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-[#444] mb-3">{label}</div>
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="text-[#555]">Allocated: <span className="text-white font-semibold">{allocated}</span></span>
                    <span className="text-[#444]">Returns: market-dependent</span>
                  </div>
                  <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barClass}`} role="progressbar" aria-label={`${name} duration progress`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── What Is Copy Trading ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">What Is Copy Trading?</h2>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 space-y-5 text-[14px] text-[#888] leading-relaxed">
            <p>
              Copy trading is a model where your invested capital is allocated to a structured strategy managed by professional traders. The strategy mirrors real market positions across defined asset classes — equities, forex, commodities, or crypto — for the duration of your investment plan.
            </p>
            <p>
              On StoxOptionHub, copy trading is organized into investment plans. Each plan specifies the strategy type, duration, minimum investment, and risk level. When you purchase a plan, your allocated capital follows that strategy until maturity. At the end of the plan, outcomes (positive or negative) are reflected in your wallet.
            </p>
            <p>
              This is not passive income — copy trading is exposure to market risk. The professional trader managing the strategy makes decisions based on market analysis, but market outcomes are never certain. Investors should only allocate capital they can afford to lose.
            </p>
          </div>

          {/* Lifecycle diagram */}
          <div className="mt-8 bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
            <div className="text-[13px] font-semibold text-white mb-5">Copy Trading Lifecycle</div>
            <div className="space-y-3">
              {[
                { from: "Your Capital", arrow: "allocated to", to: "Strategy Pool", color: "text-[#f0b429]" },
                { from: "Strategy Pool", arrow: "executes via", to: "Professional Traders", color: "text-[#22c55e]" },
                { from: "Market Activity", arrow: "reflects in", to: "Strategy Performance", color: "text-[#888]" },
                { from: "Plan Maturity", arrow: "credited to", to: "Your Wallet", color: "text-[#f0b429]" },
              ].map(({ from, arrow, to, color }) => (
                <div key={from} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                  <div className="w-32 shrink-0 text-[12px] font-semibold text-white">{from}</div>
                  <div className={`text-[10px] ${color} shrink-0 flex items-center gap-1 flex-1 justify-center`}>
                    <div className="h-px bg-current flex-1" />
                    <span className="px-1 shrink-0">{arrow}</span>
                    <ArrowRight size={10} className="shrink-0" />
                  </div>
                  <div className="w-32 text-right text-[12px] font-semibold text-white">{to}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#444] mt-4 leading-relaxed text-center">
              Market performance determines the outcome at maturity. No intermediate access to invested capital during the plan duration.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform Features ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Platform Features for Copy Traders</h2>
            <p className="text-[14px] text-[#555]">Everything you need to trade with confidence.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Eye, title: "Full Transparency", desc: "Every allocation, plan status, and maturity is visible in your dashboard. No hidden activities." },
              { icon: Shield, title: "Manual Deposit Approval", desc: "All deposits are verified on-chain before crediting. No fraudulent funding is possible." },
              { icon: BarChart2, title: "Automated Lifecycle", desc: "Plans run automatically from start to maturity. No action needed — the system handles everything." },
              { icon: TrendingUp, title: "Strategy Diversity", desc: "Choose from multiple strategies across risk levels and durations to match your investment profile." },
              { icon: Users, title: "Professional Management", desc: "Strategies are managed by experienced traders applying systematic, rule-based approaches." },
              { icon: Zap, title: "Instant Notifications", desc: "Get notified when your deposit is approved, plan starts, and when it matures — via in-app and email." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 group hover:border-[#f0b429]/15 transition-all">
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

      {/* ── Investor Control ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-5">
              <Lock size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Investor Control</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-5">
              What You Can Control
            </h2>
            <p className="text-[14px] text-[#888] leading-relaxed mb-5">
              While investment capital is locked in a plan, you retain full visibility and control over your wider account activity.
            </p>
            <ul className="space-y-3">
              {[
                "View plan status and elapsed duration in real time",
                "Track wallet balance and available funds separately from invested capital",
                "Submit withdrawal requests for available balance at any time",
                "Access full transaction history and audit trail",
                "Receive notifications for every account activity event",
                "Contact support at any time for account questions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13px] text-[#888]">
                  <CheckCircle size={13} className="text-[#f0b429] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-3">
            {[
              { label: "Investment Capital", value: "$2,000.00", status: "LOCKED IN PLAN", statusColor: "text-[#f0b429]", icon: Lock },
              { label: "Available Wallet Balance", value: "$830.00", status: "WITHDRAWABLE", statusColor: "text-[#22c55e]", icon: TrendingUp },
              { label: "Active Plan", value: "Alpha Momentum", status: "60 DAYS — DAY 24", statusColor: "text-[#888]", icon: BarChart2 },
              { label: "Maturity Date", value: "45 days remaining", status: "AUTO PAYOUT", statusColor: "text-[#555]", icon: Clock },
            ].map(({ label, value, status, statusColor, icon: Icon }) => (
              <div key={label} className="bg-[#1a1a1a] rounded-lg p-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-[#222] rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[#555]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-[14px] font-bold text-white truncate">{value}</div>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusColor}`}>{status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk Education ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Understanding the Risks</h2>
            <p className="text-[14px] text-[#555]">Important facts every investor should understand before allocating capital.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Can I lose money?", a: "Yes. Copy trading involves real market risk. Strategy losses reduce your invested capital. There is no insurance or guarantee on copy trading outcomes." },
              { q: "What does 'market-dependent returns' mean?", a: "It means the amount you receive at maturity depends entirely on how the strategy performed in live markets during your plan's duration. No one can predict this in advance." },
              { q: "Can I exit a plan early?", a: "Investment plans run for their full duration. Early exit is not supported. Only invest capital you can commit for the plan's full duration." },
              { q: "Does StoxOptionHub guarantee my capital?", a: "No. Capital is at risk. If the strategy performs poorly during your plan, you may receive less than your initial investment, or nothing at all in extreme loss scenarios." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#2a2a2a] transition-all">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={14} className="text-[#f0b429] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[14px] font-semibold text-white mb-1.5">{q}</div>
                    <div className="text-[13px] text-[#555] leading-relaxed">{a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-t border-[#1a1a1a] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Explore Copy Trading Plans</h2>
          <p className="text-[14px] text-[#555] mb-2 leading-relaxed">
            Browse available plans, review risk levels, and start your copy trading journey.
          </p>
          <p className="text-[12px] text-[#444] mb-8">Capital at risk. Returns are market-dependent and not guaranteed.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/investment-plans"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
            >
              View Investment Plans <ArrowRight size={14} />
            </Link>
            <Link
              href="/risk-disclosure"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[14px] rounded-xl transition-all"
            >
              Read Risk Disclosure
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
