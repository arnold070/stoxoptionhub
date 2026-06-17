import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserPlus, Wallet, Shield, CheckCircle, BarChart2, Clock, TrendingUp, ArrowDownToLine } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Understand the full StoxOptionHub lifecycle — from account creation and wallet funding through copy trading plan selection, automated maturity, and withdrawals.",
};

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    desc: "Register with your email and create a secure password. Verify your email address to fully activate your account and unlock access to the platform.",
    details: [
      "Email and password registration",
      "Email verification required",
      "Full dashboard access upon verification",
      "No minimum requirements to register",
    ],
    status: "Free",
  },
  {
    icon: Wallet,
    step: "02",
    title: "Fund Your Wallet",
    desc: "Navigate to your wallet and submit a crypto deposit. Enter the transaction hash (TXID), network, and amount. Your deposit enters a pending state awaiting admin review.",
    details: [
      "Supports major crypto networks",
      "Submit TXID + network + amount",
      "Deposit stays PENDING until approved",
      "Minimum deposit: $10 USDT equivalent",
    ],
    status: "Step 1 of 2",
  },
  {
    icon: Shield,
    step: "03",
    title: "Admin Reviews Your Deposit",
    desc: "Our compliance team reviews your submitted transaction on-chain to verify the transfer. This manual approval step ensures platform security and prevents fraudulent deposits.",
    details: [
      "On-chain transaction verification",
      "Typically completed within 1–24 hours",
      "You receive a notification upon review",
      "Deposits can be approved or rejected with reason",
    ],
    status: "Automated",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Wallet Credited",
    desc: "Once approved, your wallet balance is updated atomically. You receive an in-app notification and email confirmation. The full amount is immediately available for investment.",
    details: [
      "Atomic, fraud-proof credit process",
      "In-app + email notification sent",
      "Full amount available immediately",
      "Transaction recorded in audit ledger",
    ],
    status: "Immediate",
  },
  {
    icon: BarChart2,
    step: "05",
    title: "Select a Copy Trading Plan",
    desc: "Browse available investment plans filtered by strategy type, duration, risk level, and minimum amount. Choose a plan that matches your investment profile and allocate from your wallet balance.",
    details: [
      "Multiple plans across risk levels",
      "Duration from 30 to 90 days",
      "Balance deducted upon purchase",
      "Confirmation notification sent",
    ],
    status: "Your choice",
  },
  {
    icon: Clock,
    step: "06",
    title: "Plan Runs Automatically",
    desc: "Your investment plan runs for its full defined duration. The system tracks progress, and your capital follows the selected strategy. No action is required from you during this period.",
    details: [
      "Capital locked for plan duration",
      "Progress tracked on dashboard",
      "Strategy managed by professionals",
      "Market outcomes determine results",
    ],
    status: "Automated",
  },
  {
    icon: TrendingUp,
    step: "07",
    title: "Maturity & Returns Credited",
    desc: "When your plan reaches maturity, the system automatically processes the completion. Any returns (subject to market performance) are credited back to your wallet. No fixed return is guaranteed.",
    details: [
      "Automated upon plan end date",
      "Market-dependent returns only",
      "In-app + email notification",
      "Full ledger record maintained",
    ],
    status: "Automated",
    warning: "Returns are market-dependent. Capital is not guaranteed.",
  },
  {
    icon: ArrowDownToLine,
    step: "08",
    title: "Withdraw Your Funds",
    desc: "Request a withdrawal from your available wallet balance at any time. Our admin team reviews and processes the request, transferring funds to your specified crypto address.",
    details: [
      "Withdrawal to crypto address",
      "Admin review before processing",
      "Minimum withdrawal: $20 USDT",
      "Notification on approval",
    ],
    status: "On request",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#1a1a1a] text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(240,180,41,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,180,41,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f0b429]/5 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-full mb-5">
            <Clock size={11} className="text-[#f0b429]" />
            <span className="text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">Full Lifecycle</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-5">How It Works</h1>
          <p className="text-[16px] text-[#888] max-w-2xl mx-auto leading-relaxed mb-8">
            From account creation to payout — every step in the StoxOptionHub investment lifecycle is transparent, automated where possible, and fully audited.
          </p>
          {/* Quick steps summary */}
          <div className="flex flex-wrap justify-center gap-2">
            {["Create Account", "Fund Wallet", "Admin Approval", "Select Plan", "Plan Runs", "Payout", "Withdraw"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#111] border border-[#1e1e1e] rounded-full text-[11px] text-[#888]">{s}</span>
                {i < 6 && <span className="text-[#2a2a2a] text-[10px]">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 sm:left-[22px] top-10 bottom-10 w-px bg-gradient-to-b from-[#f0b429]/40 via-[#f0b429]/10 to-transparent pointer-events-none" aria-hidden="true" />

            <div className="space-y-5">
              {steps.map(({ icon: Icon, step, title, desc, details, status, warning }) => (
                <div key={step} className="relative flex gap-5 sm:gap-7">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center shrink-0 z-10">
                    <div className="w-11 h-11 rounded-full bg-[#0a0a0a] border-2 border-[#f0b429]/40 flex items-center justify-center">
                      <Icon size={16} className="text-[#f0b429]" />
                    </div>
                    <div className="text-[9px] text-[#333] font-bold mt-0.5">{step}</div>
                  </div>

                  <div className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 sm:p-6 hover:border-[#f0b429]/15 transition-all mb-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-[18px] font-bold text-white">{title}</h2>
                      <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider bg-[#1a1a1a] border border-[#222] px-2 py-0.5 rounded">
                        {status}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#888] leading-relaxed mb-4">{desc}</p>

                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {details.map((d) => (
                        <div key={d} className="flex items-start gap-2 text-[12px] text-[#666]">
                          <CheckCircle size={12} className="text-[#f0b429] mt-0.5 shrink-0" />
                          {d}
                        </div>
                      ))}
                    </div>

                    {warning && (
                      <div className="p-3 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-lg">
                        <p className="text-[12px] text-[#888]">
                          <span className="text-[#ef4444] font-semibold">Important:</span> {warning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Summary timeline */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Quick Reference Timeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[500px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Step</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Action</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Who</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Timeframe</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { step: "01", action: "Account creation", who: "User", time: "Instant" },
                  { step: "02", action: "Submit deposit", who: "User", time: "Instant" },
                  { step: "03", action: "Deposit review", who: "Admin", time: "1–24 hours" },
                  { step: "04", action: "Wallet credit", who: "System", time: "Instant on approval" },
                  { step: "05", action: "Select investment plan", who: "User", time: "Instant" },
                  { step: "06", action: "Plan execution", who: "System + Traders", time: "30–90 days" },
                  { step: "07", action: "Maturity payout", who: "System", time: "Automatic at end date" },
                  { step: "08", action: "Withdrawal request", who: "User + Admin", time: "1–3 business days" },
                ].map(({ step, action, who, time }) => (
                  <tr key={step} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-3 text-[#f0b429] font-bold">{step}</td>
                    <td className="py-3 text-white">{action}</td>
                    <td className="py-3 text-[#555]">{who}</td>
                    <td className="py-3 text-[#888]">{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Begin?</h2>
          <p className="text-[14px] text-[#555] mb-2 leading-relaxed">
            Create your account in minutes and start the investment lifecycle today.
          </p>
          <p className="text-[12px] text-[#444] mb-8">All investments carry market risk. Capital is not guaranteed.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[14px] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
            >
              Create Account <ArrowRight size={14} />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#2a2a2a] hover:border-[#f0b429]/30 text-white font-semibold text-[14px] rounded-xl transition-all"
            >
              Browse FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
