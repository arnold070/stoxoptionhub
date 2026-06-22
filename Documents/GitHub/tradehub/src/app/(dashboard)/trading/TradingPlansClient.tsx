"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Hash, AlertTriangle, CheckCircle, Clock, Users, ShieldCheck, ArrowUpRight } from "lucide-react";
import { allocateToStrategy } from "@/lib/actions/copy-trading";

const TIER_META: Record<string, { label: string; cls: string; border: string; glow: string; stripe: string }> = {
  BRONZE:   { label: "BRONZE",   cls: "text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/30",  border: "border-[#cd7f32]/25",  glow: "hover:border-[#cd7f32]/50",  stripe: "bg-[#cd7f32]" },
  SILVER:   { label: "SILVER",   cls: "text-[#aaa] bg-[#aaa]/10 border-[#aaa]/30",            border: "border-[#aaa]/20",     glow: "hover:border-[#aaa]/40",     stripe: "bg-[#aaa]"     },
  GOLD:     { label: "GOLD",     cls: "text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30",  border: "border-[#f0b429]/25",  glow: "hover:border-[#f0b429]/50",  stripe: "bg-[#f0b429]" },
  PLATINUM: { label: "PLATINUM", cls: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/30",  border: "border-[#818cf8]/25",  glow: "hover:border-[#818cf8]/50",  stripe: "bg-[#818cf8]" },
};

type Strategy = {
  id: string;
  name: string;
  description: string;
  tier: string;
  minAmount: number;
  maxAmount: number | null;
  roiPercent: number;
  durationDays: number;
  managedBy: string | null;
  subscriberCount: number;
};

type Props = {
  strategies: Strategy[];
  myAllocationIds: string[];
};

export default function TradingPlansClient({ strategies, myAllocationIds }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [amount, setAmount] = useState("");
  const [hashCode, setHashCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allocatedSet = new Set(myAllocationIds);

  function openModal(s: Strategy) {
    setSelected(s);
    setAmount(String(s.minAmount));
    setHashCode("");
    setError(null);
    setSuccess(false);
  }

  function closeModal() {
    if (pending) return;
    setSelected(null);
  }

  function submit() {
    if (!selected) return;
    const amt = parseFloat(amount);
    if (!hashCode.trim()) { setError("Please enter your trading code."); return; }
    if (isNaN(amt) || amt < selected.minAmount) {
      setError(`Minimum investment is $${selected.minAmount.toLocaleString()}`);
      return;
    }
    if (selected.maxAmount && amt > selected.maxAmount) {
      setError(`Maximum investment is $${selected.maxAmount.toLocaleString()}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await allocateToStrategy({
        strategyId: selected.id,
        amount: amt,
        hashCode: hashCode.trim(),
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSelected(null);
          router.refresh();
        }, 1800);
      }
    });
  }

  return (
    <>
      {/* Plan cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {strategies.map((strategy) => {
          const isAllocated = allocatedSet.has(strategy.id);
          const meta = TIER_META[strategy.tier] ?? TIER_META.BRONZE;

          return (
            <div
              key={strategy.id}
              className={`bg-[#111] border ${isAllocated ? "border-[#f0b429]/40" : `border-[#1e1e1e] ${meta.glow}`} rounded-xl overflow-hidden transition-colors`}
            >
              <div className={`h-1 w-full ${meta.stripe}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls} mb-2 inline-block`}>{meta.label}</span>
                    <h3 className="font-bold text-white text-[16px] leading-tight">{strategy.name}</h3>
                    <p className="text-[11px] text-[#555] mt-0.5">{strategy.description}</p>
                  </div>
                  {isAllocated && (
                    <span className="shrink-0 ml-2 flex items-center gap-1 text-[10px] text-[#22c55e] font-semibold">
                      <CheckCircle size={11} /> Subscribed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">% Profit</div>
                    <div className="text-[18px] font-bold text-[#22c55e]">{strategy.roiPercent}%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5 flex items-center gap-1"><Clock size={9} /> Duration</div>
                    <div className="text-[18px] font-bold text-white">{strategy.durationDays}d</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Min</div>
                    <div className="text-[14px] font-bold text-white">${strategy.minAmount.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Max</div>
                    <div className="text-[14px] font-bold text-white">{strategy.maxAmount ? `$${strategy.maxAmount.toLocaleString()}` : "Unlimited"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#555] mb-4">
                  <Users size={11} />
                  <span>{strategy.subscriberCount} active subscriber{strategy.subscriberCount !== 1 ? "s" : ""}</span>
                  {strategy.managedBy && <><span>·</span><span>{strategy.managedBy}</span></>}
                </div>

                {isAllocated ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 text-[#f0b429] text-[12px] font-semibold bg-[#f0b429]/5 rounded-lg border border-[#f0b429]/20">
                    <ArrowUpRight size={13} /> Currently subscribed
                  </div>
                ) : (
                  <button
                    onClick={() => openModal(strategy)}
                    className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors"
                  >
                    Subscribe Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscribe modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          <div className={`relative w-full max-w-md bg-[#111] border ${(TIER_META[selected.tier] ?? TIER_META.BRONZE).border} rounded-2xl shadow-2xl`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
              <div>
                <h2 className="text-[17px] font-bold text-white">Subscribe to {selected.name}</h2>
                <p className="text-[12px] text-[#555] mt-0.5">Enter your trading code to activate the plan</p>
              </div>
              <button onClick={closeModal} disabled={pending} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors disabled:opacity-40">
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="px-6 py-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-4">
                  <CheckCircle size={28} className="text-[#22c55e]" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-1">Subscription Activated!</h3>
                <p className="text-[13px] text-[#555]">You've been assigned to your trader. Your plan is now active.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 space-y-4">
                  {/* Plan summary */}
                  <div className="bg-[#1a1a1a] rounded-xl p-4 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <div className="text-[#555] mb-0.5">Plan</div>
                      <div className="font-semibold text-white">{selected.name}</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-0.5">% Profit</div>
                      <div className="font-bold text-[#22c55e]">{selected.roiPercent}%</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-0.5">Duration</div>
                      <div className="font-semibold text-white">{selected.durationDays} days</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-0.5">Min / Max</div>
                      <div className="font-semibold text-white">
                        ${selected.minAmount.toLocaleString()} / {selected.maxAmount ? `$${selected.maxAmount.toLocaleString()}` : "∞"}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Investment Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={selected.minAmount}
                      max={selected.maxAmount ?? undefined}
                      step="0.01"
                      disabled={pending}
                      placeholder={`Min $${selected.minAmount.toLocaleString()}`}
                      className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 disabled:opacity-50"
                    />
                  </div>

                  {/* Trading hash code */}
                  <div>
                    <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">
                      Trading Code <span className="text-[#444] normal-case">(provided by admin)</span>
                    </label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                      <input
                        type="text"
                        value={hashCode}
                        onChange={(e) => setHashCode(e.target.value)}
                        disabled={pending}
                        placeholder="e.g. TRD-ABCD1234"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] font-mono text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[10px] text-[#444] mt-1.5">Contact your admin to receive a valid trading code before subscribing.</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
                      <AlertTriangle size={13} className="text-[#ef4444] mt-0.5 shrink-0" />
                      <p className="text-[12px] text-[#ef4444]">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 px-6 pb-6">
                  <button
                    onClick={closeModal}
                    disabled={pending}
                    className="flex-1 py-2.5 text-[13px] font-semibold text-[#777] border border-[#2a2a2a] rounded-lg hover:text-white hover:border-[#3a3a3a] transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={pending}
                    className="flex-1 py-2.5 text-[13px] font-bold rounded-lg bg-[#f0b429] hover:bg-[#e0a424] text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pending ? "Verifying…" : "Confirm & Subscribe"}
                  </button>
                </div>

                <div className="flex items-center gap-2 px-6 pb-5 text-[10px] text-[#333]">
                  <ShieldCheck size={11} />
                  <span>Returns are market-dependent and not guaranteed. Capital is subject to market risk.</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
