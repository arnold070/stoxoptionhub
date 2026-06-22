"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Zap, X, Wallet, AlertTriangle } from "lucide-react";
import { purchaseMembership } from "@/lib/actions/memberships";

const PLAN_ACCENTS: Record<string, { border: string; badge: string; btn: string; modal: string }> = {
  "Beginner Track":     { border: "border-[#22c55e]/30",  badge: "bg-[#22c55e]/10 text-[#22c55e]",  btn: "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]",  modal: "border-[#22c55e]/30" },
  "Intermediate Track": { border: "border-[#f0b429]/40",  badge: "bg-[#f0b429]/10 text-[#f0b429]",  btn: "bg-[#f0b429] hover:bg-[#e0a424] text-black",                           modal: "border-[#f0b429]/40" },
  "Advanced Track":     { border: "border-[#ef4444]/30",  badge: "bg-[#818cf8]/10 text-[#818cf8]",  btn: "bg-[#818cf8] hover:bg-[#6366f1] text-white",                           modal: "border-[#818cf8]/30" },
};
const DEFAULT_ACCENT = { border: "border-[#2a2a2a]", badge: "bg-[#1e1e1e] text-[#888]", btn: "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]", modal: "border-[#2a2a2a]" };

function parseBenefits(raw: string): string[] {
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch { /* fallthrough */ }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number | null;
  benefits: string;
};

type Props = {
  plans: Plan[];
  activeMembershipPlanId?: string;
  walletBalance: number;
};

export default function MembershipPlansClient({ plans, activeMembershipPlanId, walletBalance }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openModal(plan: Plan) {
    setError(null);
    setSelected(plan);
  }

  function closeModal() {
    if (pending) return;
    setSelected(null);
    setError(null);
  }

  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await purchaseMembership({ planId: selected.id });
      if (!result.success) {
        setError(result.error);
      } else {
        setSelected(null);
        router.refresh();
      }
    });
  }

  const canAfford = selected ? walletBalance >= selected.price : false;
  const afterBalance = selected ? walletBalance - selected.price : 0;

  return (
    <>
      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = activeMembershipPlanId === plan.id;
          const benefits = parseBenefits(plan.benefits);
          const accent = PLAN_ACCENTS[plan.name] ?? DEFAULT_ACCENT;

          return (
            <div key={plan.id} className={`bg-[#111] border ${accent.border} rounded-xl p-6 flex flex-col`}>
              {isCurrent && (
                <div className={`inline-flex items-center gap-1.5 self-start mb-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}>
                  <Zap size={10} /> Current Plan
                </div>
              )}
              <h3 className="text-[18px] font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-[12px] text-[#555] mb-4">{plan.description}</p>
              <div className="mb-5">
                <span className="text-[32px] font-bold text-white">
                  ${plan.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {plan.duration && (
                  <span className="text-[13px] text-[#555] ml-1">
                    / {Math.round(plan.duration / 7)} weeks
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12px] text-[#888]">
                    <CheckCircle size={13} className="text-[#22c55e] mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <button
                  onClick={() => openModal(plan)}
                  className={`w-full py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-colors ${accent.btn}`}
                >
                  Get {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className={`relative w-full max-w-md bg-[#111] border ${(PLAN_ACCENTS[selected.name] ?? DEFAULT_ACCENT).modal} rounded-2xl shadow-2xl`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
              <div>
                <h2 className="text-[17px] font-bold text-white">Confirm Subscription</h2>
                <p className="text-[12px] text-[#555] mt-0.5">Review your plan before subscribing</p>
              </div>
              <button
                onClick={closeModal}
                disabled={pending}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Plan summary */}
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">Selected Plan</p>
                    <h3 className="text-[16px] font-bold text-white">{selected.name}</h3>
                    <p className="text-[12px] text-[#555] mt-0.5">{selected.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[22px] font-bold text-white">
                      ${selected.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    {selected.duration && (
                      <p className="text-[11px] text-[#555]">{Math.round(selected.duration / 7)} weeks</p>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-1.5 pt-3 border-t border-[#2a2a2a]">
                  {parseBenefits(selected.benefits).slice(0, 4).map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[12px] text-[#777]">
                      <CheckCircle size={11} className="text-[#22c55e] mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                  {parseBenefits(selected.benefits).length > 4 && (
                    <li className="text-[11px] text-[#444] pl-4">
                      +{parseBenefits(selected.benefits).length - 4} more benefits
                    </li>
                  )}
                </ul>
              </div>

              {/* Wallet summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={12} className="text-[#555]" />
                  <span className="text-[11px] text-[#555] uppercase tracking-wider">Wallet Summary</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#777]">Current balance</span>
                  <span className="text-white font-medium">
                    ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#777]">Plan cost</span>
                  <span className="text-[#ef4444] font-medium">
                    −${selected.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[13px] pt-2 border-t border-[#1e1e1e] font-semibold">
                  <span className="text-[#aaa]">Balance after</span>
                  <span className={canAfford ? "text-white" : "text-[#ef4444]"}>
                    ${afterBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {!canAfford && (
                <div className="flex items-start gap-2.5 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
                  <AlertTriangle size={13} className="text-[#ef4444] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[#ef4444]">
                    Insufficient balance. Please deposit funds to your wallet before subscribing.
                  </p>
                </div>
              )}

              {/* Server error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
                  <AlertTriangle size={13} className="text-[#ef4444] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[#ef4444]">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeModal}
                disabled={pending}
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#777] border border-[#2a2a2a] rounded-lg hover:text-white hover:border-[#3a3a3a] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={pending || !canAfford}
                className="flex-1 py-2.5 text-[13px] font-bold rounded-lg bg-[#f0b429] hover:bg-[#e0a424] text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Processing…" : "Confirm & Subscribe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
