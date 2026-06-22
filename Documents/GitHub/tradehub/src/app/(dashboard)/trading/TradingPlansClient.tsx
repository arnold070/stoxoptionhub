"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Hash, AlertTriangle, CheckCircle, Clock, Users, ShieldCheck, ArrowUpRight, Wallet, Copy as CopyIcon, Banknote } from "lucide-react";
import { allocateToStrategy } from "@/lib/actions/copy-trading";
import { submitPlanDeposit } from "@/lib/actions/wallet";

const TIER_META: Record<string, { label: string; cls: string; border: string; glow: string; stripe: string }> = {
  BRONZE:   { label: "BRONZE",   cls: "text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/30",  border: "border-[#cd7f32]/25",  glow: "hover:border-[#cd7f32]/50",  stripe: "bg-[#cd7f32]" },
  SILVER:   { label: "SILVER",   cls: "text-[#aaa] bg-[#aaa]/10 border-[#aaa]/30",            border: "border-[#aaa]/20",     glow: "hover:border-[#aaa]/40",     stripe: "bg-[#aaa]"     },
  GOLD:     { label: "GOLD",     cls: "text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30",  border: "border-[#f0b429]/25",  glow: "hover:border-[#f0b429]/50",  stripe: "bg-[#f0b429]" },
  PLATINUM: { label: "PLATINUM", cls: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/30",  border: "border-[#818cf8]/25",  glow: "hover:border-[#818cf8]/50",  stripe: "bg-[#818cf8]" },
};

const NETWORKS = [
  { value: "TRC20", label: "USDT (TRC20)" },
  { value: "ERC20", label: "USDT (ERC20)" },
  { value: "BEP20", label: "USDT (BEP20)" },
  { value: "ETH",   label: "Ethereum (ETH)" },
  { value: "BTC",   label: "Bitcoin (BTC)" },
];

type Strategy = {
  id: string; name: string; description: string; tier: string;
  minAmount: number; maxAmount: number | null;
  roiPercent: number; durationDays: number;
  managedBy: string | null; subscriberCount: number;
};

type DepositAddresses = Record<string, string>;

type Props = {
  strategies: Strategy[];
  myAllocationIds: string[];
  depositAddresses: DepositAddresses;
};

type PayMethod = "balance" | "deposit";
type Stage = "form" | "success";

export default function TradingPlansClient({ strategies, myAllocationIds, depositAddresses }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Strategy | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("balance");
  const [amount, setAmount] = useState("");
  const [hashCode, setHashCode] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [successTrader, setSuccessTrader] = useState("");
  const [copied, setCopied] = useState(false);

  const allocatedSet = new Set(myAllocationIds);

  function openModal(s: Strategy) {
    setSelected(s); setAmount(String(s.minAmount)); setHashCode("");
    setNetwork("TRC20"); setTxHash(""); setError(null);
    setStage("form"); setPayMethod("balance"); setSuccessTrader("");
  }

  function closeModal() { if (pending) return; setSelected(null); }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function submit() {
    if (!selected) return;
    const amt = parseFloat(amount);
    if (!hashCode.trim()) { setError("Please enter your trading code."); return; }
    if (isNaN(amt) || amt < selected.minAmount) { setError(`Minimum is $${selected.minAmount.toLocaleString()}`); return; }
    if (selected.maxAmount && amt > selected.maxAmount) { setError(`Maximum is $${selected.maxAmount.toLocaleString()}`); return; }
    if (payMethod === "deposit" && !txHash.trim()) { setError("Transaction hash is required."); return; }
    setError(null);

    startTransition(async () => {
      if (payMethod === "balance") {
        const result = await allocateToStrategy({ strategyId: selected.id, amount: amt, hashCode: hashCode.trim() });
        if (!result.success) { setError(result.error); return; }
        setSuccessTrader(""); setStage("success");
      } else {
        const result = await submitPlanDeposit({
          planType: "copy", planId: selected.id,
          hashCode: hashCode.trim(), amount: amt, network, txHash: txHash.trim(),
        });
        if (!result.success) { setError(result.error); return; }
        setSuccessTrader(result.traderName); setStage("success");
      }
      setTimeout(() => { setSelected(null); router.refresh(); }, payMethod === "balance" ? 1800 : 10000);
    });
  }

  const depositAddr = depositAddresses[network] ?? "";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {strategies.map((strategy) => {
          const isAllocated = allocatedSet.has(strategy.id);
          const meta = TIER_META[strategy.tier] ?? TIER_META.BRONZE;
          return (
            <div key={strategy.id} className={`bg-[#111] border ${isAllocated ? "border-[#f0b429]/40" : `border-[#1e1e1e] ${meta.glow}`} rounded-xl overflow-hidden transition-colors`}>
              <div className={`h-1 w-full ${meta.stripe}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls} mb-2 inline-block`}>{meta.label}</span>
                    <h3 className="font-bold text-white text-[16px] leading-tight">{strategy.name}</h3>
                    <p className="text-[11px] text-[#555] mt-0.5">{strategy.description}</p>
                  </div>
                  {isAllocated && <span className="shrink-0 ml-2 flex items-center gap-1 text-[10px] text-[#22c55e] font-semibold"><CheckCircle size={11} /> Subscribed</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "% Profit", value: `${strategy.roiPercent}%`, cls: "text-[18px] font-bold text-[#22c55e]" },
                    { label: "Duration", value: `${strategy.durationDays}d`, cls: "text-[18px] font-bold text-white" },
                    { label: "Min", value: `$${strategy.minAmount.toLocaleString()}`, cls: "text-[14px] font-bold text-white" },
                    { label: "Max", value: strategy.maxAmount ? `$${strategy.maxAmount.toLocaleString()}` : "Unlimited", cls: "text-[14px] font-bold text-white" },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        {label === "Duration" && <Clock size={9} />}{label}
                      </div>
                      <div className={cls}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#555] mb-4">
                  <Users size={11} />
                  <span>{strategy.subscriberCount} subscriber{strategy.subscriberCount !== 1 ? "s" : ""}</span>
                  {strategy.managedBy && <><span>·</span><span>{strategy.managedBy}</span></>}
                </div>
                {isAllocated ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 text-[#f0b429] text-[12px] font-semibold bg-[#f0b429]/5 rounded-lg border border-[#f0b429]/20">
                    <ArrowUpRight size={13} /> Currently subscribed
                  </div>
                ) : (
                  <button type="button" onClick={() => openModal(strategy)} className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                    Subscribe Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className={`relative w-full max-w-md bg-[#111] border ${(TIER_META[selected.tier] ?? TIER_META.BRONZE).border} rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto`}>

            {stage === "success" ? (
              <div className="px-6 py-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-4">
                  <CheckCircle size={28} className="text-[#22c55e]" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">
                  {payMethod === "balance" ? "Subscription Activated!" : "Deposit Submitted!"}
                </h3>
                {payMethod === "deposit" ? (
                  <>
                    <p className="text-[13px] text-[#888] mb-4 leading-relaxed">
                      Your deposit is pending admin approval. Once approved, your <span className="text-white font-semibold">{selected.name}</span> plan will activate automatically.
                    </p>
                    {successTrader && (
                      <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                        <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">Assigned Trader</p>
                        <p className="text-[18px] font-bold text-[#f0b429]">{successTrader}</p>
                        <p className="text-[12px] text-[#555] mt-1.5">Reach out to {successTrader} once your plan is active.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] text-[#555]">You've been assigned to your trader. Your plan is now active.</p>
                )}
                <p className="text-[10px] text-[#444] mt-4">Redirecting in a moment…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
                  <div>
                    <h2 className="text-[17px] font-bold text-white">Subscribe to {selected.name}</h2>
                    <p className="text-[12px] text-[#555] mt-0.5">Choose how you'd like to pay</p>
                  </div>
                  <button type="button" aria-label="Close" onClick={closeModal} disabled={pending} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors disabled:opacity-40">
                    <X size={16} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Payment method tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    {([["balance", Wallet, "Broker Balance"], ["deposit", Banknote, "Make a Deposit"]] as const).map(([val, Icon, label]) => (
                      <button key={val} type="button" onClick={() => { setPayMethod(val as PayMethod); setError(null); }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold border transition-colors ${payMethod === val ? "bg-[#f0b429]/10 border-[#f0b429]/40 text-[#f0b429]" : "bg-[#1a1a1a] border-[#2a2a2a] text-[#555] hover:text-white"}`}>
                        <Icon size={13} />{label}
                      </button>
                    ))}
                  </div>

                  {/* Plan summary */}
                  <div className="bg-[#1a1a1a] rounded-xl p-3 grid grid-cols-2 gap-2 text-[12px]">
                    <div><div className="text-[#555] mb-0.5">Plan</div><div className="font-semibold text-white">{selected.name}</div></div>
                    <div><div className="text-[#555] mb-0.5">ROI</div><div className="font-bold text-[#22c55e]">{selected.roiPercent}%</div></div>
                    <div><div className="text-[#555] mb-0.5">Duration</div><div className="font-semibold text-white">{selected.durationDays}d</div></div>
                    <div><div className="text-[#555] mb-0.5">Min / Max</div><div className="font-semibold text-white">${selected.minAmount.toLocaleString()} / {selected.maxAmount ? `$${selected.maxAmount.toLocaleString()}` : "∞"}</div></div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Investment Amount</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={selected.minAmount} max={selected.maxAmount ?? undefined} step="0.01" disabled={pending} placeholder={`Min $${selected.minAmount.toLocaleString()}`}
                      className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 disabled:opacity-50" />
                  </div>

                  {/* Deposit-specific fields */}
                  {payMethod === "deposit" && (
                    <>
                      <div>
                        <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Network</label>
                        <select value={network} onChange={(e) => setNetwork(e.target.value)} disabled={pending} aria-label="Network"
                          className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white outline-none focus:border-[#f0b429]/50 disabled:opacity-50">
                          {NETWORKS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                        </select>
                      </div>
                      {depositAddr ? (
                        <div>
                          <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Deposit Address</label>
                          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5">
                            <code className="text-[11px] font-mono text-[#f0b429] flex-1 break-all">{depositAddr}</code>
                            <button type="button" aria-label="Copy address" onClick={() => copyAddress(depositAddr)} className="shrink-0 text-[#555] hover:text-white transition-colors">
                              <CopyIcon size={13} />
                            </button>
                          </div>
                          {copied && <p className="text-[10px] text-[#22c55e] mt-1">Copied!</p>}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-[12px] text-[#ef4444]">
                          No deposit address configured for this network. Contact admin.
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Transaction Hash / Proof</label>
                        <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} disabled={pending} placeholder="Paste your tx hash here"
                          className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] font-mono text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 disabled:opacity-50" />
                      </div>
                    </>
                  )}

                  {/* Hash code */}
                  <div>
                    <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1.5">Trading Code <span className="text-[#444] normal-case">(provided by admin)</span></label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                      <input type="text" value={hashCode} onChange={(e) => setHashCode(e.target.value)} disabled={pending} placeholder="e.g. TRD-ABCD1234"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] font-mono text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 disabled:opacity-50" />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
                      <AlertTriangle size={13} className="text-[#ef4444] mt-0.5 shrink-0" />
                      <p className="text-[12px] text-[#ef4444]">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 px-6 pb-5">
                  <button type="button" onClick={closeModal} disabled={pending} className="flex-1 py-2.5 text-[13px] font-semibold text-[#777] border border-[#2a2a2a] rounded-lg hover:text-white hover:border-[#3a3a3a] transition-colors disabled:opacity-40">
                    Cancel
                  </button>
                  <button type="button" onClick={submit} disabled={pending} className="flex-1 py-2.5 text-[13px] font-bold rounded-lg bg-[#f0b429] hover:bg-[#e0a424] text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {pending ? "Verifying…" : payMethod === "balance" ? "Confirm & Subscribe" : "Submit Deposit"}
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
