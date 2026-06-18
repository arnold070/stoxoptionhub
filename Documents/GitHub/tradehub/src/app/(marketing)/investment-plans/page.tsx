import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle, BarChart2, Lock, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Investment Plans",
  description:
    "Browse StoxOptionHub's structured copy trading investment plans. Market-dependent returns, defined durations, clear risk levels. No guaranteed profits.",
};

const plans = [
  {
    name: "Starter Growth",
    duration: "30 Days",
    strategy: "Conservative Blend",
    strategyDesc: "Diversified low-volatility asset basket with defensive positioning.",
    risk: "Low",
    riskColor: "text-[#22c55e]",
    riskBg: "bg-[#22c55e]/10",
    riskBorder: "border-[#22c55e]/20",
    minAmount: "$1,000",
    description: "A short-duration plan for investors new to copy trading. Allocates to conservative, diversified strategies with lower volatility exposure.",
    features: ["Lower volatility strategy basket", "30-day structured duration", "Automated lifecycle management", "Payout to wallet upon maturity"],
  },
  {
    name: "Balanced Horizon",
    duration: "45 Days",
    strategy: "Balanced Portfolio",
    strategyDesc: "Equal-weight split between defensive and growth positions.",
    risk: "Low–Medium",
    riskColor: "text-[#22c55e]",
    riskBg: "bg-[#22c55e]/10",
    riskBorder: "border-[#22c55e]/20",
    minAmount: "$5,000",
    description: "A balanced plan combining defensive and growth strategies for a 45-day duration. Suitable for investors seeking diversification without extreme risk.",
    features: ["Equal-weight defensive / growth split", "45-day structured duration", "Mid-cycle rebalancing if applicable", "Suitable for moderate risk appetite"],
  },
  {
    name: "Alpha Momentum",
    duration: "60 Days",
    strategy: "Momentum Trading",
    strategyDesc: "Trend-following across major crypto and forex pairs.",
    risk: "Medium",
    riskColor: "text-[#f0b429]",
    riskBg: "bg-[#f0b429]/10",
    riskBorder: "border-[#f0b429]/20",
    minAmount: "$10,000",
    description: "A mid-duration plan using momentum-based trading strategies across major asset pairs. Suitable for investors with moderate risk tolerance.",
    features: ["Momentum strategy across multiple pairs", "60-day structured duration", "Professional trader management", "Dashboard tracking throughout"],
    featured: true,
  },
  {
    name: "Institutional Edge",
    duration: "90 Days",
    strategy: "Multi-Asset Arbitrage",
    strategyDesc: "Advanced cross-market arbitrage with active risk controls.",
    risk: "High",
    riskColor: "text-[#ef4444]",
    riskBg: "bg-[#ef4444]/10",
    riskBorder: "border-[#ef4444]/20",
    minAmount: "$20,000",
    description: "A long-duration, high-complexity plan using multi-asset arbitrage strategies. For experienced investors with higher risk capacity.",
    features: ["Multi-asset arbitrage strategy", "90-day structured duration", "Advanced risk management applied", "Full audit trail in dashboard"],
  },
];

const riskMatrix = [
  { plan: "Starter Growth", duration: "30d", min: "$1,000", risk: "Low", riskClass: "text-[#22c55e]", dot: "bg-[#22c55e]" },
  { plan: "Balanced Horizon", duration: "45d", min: "$5,000", risk: "Low–Med", riskClass: "text-[#22c55e]", dot: "bg-[#22c55e]" },
  { plan: "Alpha Momentum", duration: "60d", min: "$10,000", risk: "Medium", riskClass: "text-[#f0b429]", dot: "bg-[#f0b429]" },
  { plan: "Institutional Edge", duration: "90d", min: "$20,000", risk: "High", riskClass: "text-[#ef4444]", dot: "bg-[#ef4444]" },
];

export default function InvestmentPlansPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f0b429]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-5">
            <TrendingUp size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Copy Trading Plans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-5">
            Structured Investment Plans
          </h1>
          <p className="text-[16px] text-[#888] leading-relaxed max-w-2xl mx-auto mb-8">
            Choose a copy trading plan aligned with your risk tolerance and investment horizon. Each plan is strategy-backed, duration-defined, and managed transparently.
          </p>
          <div className="inline-flex items-start gap-3 p-4 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl text-left max-w-xl">
            <AlertTriangle size={14} className="text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#888] leading-relaxed">
              <span className="text-[#ef4444] font-semibold">Risk Warning:</span> All investment plans carry market risk. Returns are not guaranteed. The value of your investment may go up or down. Capital is at risk. Please read our{" "}
              <Link href="/risk-disclosure" className="text-[#888] underline hover:text-white transition-colors">Risk Disclosure</Link> before investing.
            </p>
          </div>
        </div>
      </section>

      {/* ── Plan Cards ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(({ name, duration, strategy, strategyDesc, risk, riskColor, riskBg, riskBorder, minAmount, description, features, featured }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all ${
                  featured
                    ? "bg-[#111] border-2 border-[#f0b429]/40 shadow-[0_0_50px_rgba(240,180,41,0.07)] hover:shadow-[0_0_60px_rgba(240,180,41,0.1)]"
                    : "bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a]"
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-[#f0b429] text-black text-[10px] font-bold rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(240,180,41,0.4)]">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-[20px] font-bold text-white">{name}</h2>
                    <div className="text-[12px] text-[#555] mt-0.5 font-medium">{strategy}</div>
                    <div className="text-[11px] text-[#444] mt-0.5">{strategyDesc}</div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${riskBg} ${riskBorder} ${riskColor}`}>
                    <Shield size={11} />
                    {risk}
                  </div>
                </div>

                <p className="text-[13px] text-[#888] leading-relaxed mb-5">{description}</p>

                {/* Duration + min */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={11} className="text-[#555]" />
                      <span className="text-[10px] text-[#555] uppercase tracking-wider">Duration</span>
                    </div>
                    <div className="text-[16px] font-bold text-white">{duration}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock size={11} className="text-[#555]" />
                      <span className="text-[10px] text-[#555] uppercase tracking-wider">Minimum</span>
                    </div>
                    <div className="text-[16px] font-bold text-white">{minAmount}</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[12px] text-[#666]">
                      <CheckCircle size={13} className="text-[#f0b429] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="p-3 bg-[#1a1a1a] rounded-lg mb-5 border border-[#222]">
                  <p className="text-[11px] text-[#444] leading-relaxed text-center">
                    Market-dependent returns only. No ROI guaranteed. Capital at risk.
                  </p>
                </div>

                <Link
                  href="/register"
                  className={`w-full py-3 rounded-xl text-[13px] font-bold text-center transition-all ${
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
        </div>
      </section>

      {/* ── Risk Comparison Matrix ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full mb-4">
              <BarChart2 size={11} className="text-[#f0b429]" />
              <span className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Plan Comparison</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Side-by-Side Overview</h2>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#0d0d0d]">
                  {["Plan", "Duration", "Min. Investment", "Risk Level"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-[#555] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskMatrix.map(({ plan, duration, min, risk, riskClass, dot }, i) => (
                  <tr key={plan} className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors ${i === riskMatrix.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-5 py-4 text-[13px] font-semibold text-white">{plan}</td>
                    <td className="px-5 py-4 text-[13px] text-[#888]">{duration}</td>
                    <td className="px-5 py-4 text-[13px] text-[#888]">{min}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${riskClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        {risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-[11px] text-[#444] mt-4">
            All plans are market-dependent. Past strategy performance is not indicative of future results.
          </p>
        </div>
      </section>

      {/* ── How Plans Work ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How Investment Plans Work</h2>
            <p className="text-[14px] text-[#555]">Four steps from wallet to payout.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { step: "01", icon: Zap, title: "Fund Your Wallet", desc: "Submit a crypto deposit. Our admin team verifies and approves it before crediting your wallet." },
              { step: "02", icon: BarChart2, title: "Select a Plan", desc: "Choose an investment plan matching your risk level, duration preference, and minimum amount." },
              { step: "03", icon: Clock, title: "Plan Runs Automatically", desc: "Your allocation is tracked throughout the plan duration. No action needed — the system manages the lifecycle." },
              { step: "04", icon: TrendingUp, title: "Maturity & Payout", desc: "At plan completion, any returns (subject to market performance) are automatically credited to your wallet." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#f0b429]/15 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[28px] font-bold text-[#1e1e1e] group-hover:text-[#f0b429]/10 transition-colors leading-none">{step}</div>
                  <div className="w-8 h-8 bg-[#1a1a1a] group-hover:bg-[#f0b429]/10 rounded-lg flex items-center justify-center transition-colors">
                    <Icon size={15} className="text-[#555] group-hover:text-[#f0b429] transition-colors" />
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-t border-[#1a1a1a] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Start Investing?</h2>
          <p className="text-[14px] text-[#555] mb-2 leading-relaxed">
            Create a free account to access investment plans, fund your wallet, and begin your copy trading journey.
          </p>
          <p className="text-[12px] text-[#444] mb-8">Capital is at risk. Returns are market-dependent and not guaranteed.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
          >
            Create Free Account <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
