"use client";

import { useState, useTransition } from "react";
import { requestDeposit, requestWithdrawal } from "@/lib/actions/wallet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Copy, Shield, CheckCircle } from "lucide-react";

type NetworkKey = "TRC20" | "ERC20" | "BEP20" | "BTC";

const NETWORKS: { value: NetworkKey; label: string }[] = [
  { value: "TRC20", label: "USDT (TRC-20)" },
  { value: "ERC20", label: "USDT (ERC-20)" },
  { value: "BEP20", label: "USDT (BEP-20)" },
  { value: "BTC",   label: "Bitcoin (BTC)" },
];

interface Props {
  wallet: { balance: number; currency: string } | null;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    network: string | null;
    createdAt: Date;
  }>;
  stats: { allocated: number; pendingDeposits: number; activeInvestmentCount: number };
  depositAddresses: Record<NetworkKey, string>;
}

export default function WalletClient({ wallet, transactions, stats, depositAddresses }: Props) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [network, setNetwork] = useState<NetworkKey>("TRC20");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const currentAddress = depositAddresses[network] ?? "";

  function copyAddress() {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDeposit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestDeposit({
        amount: parseFloat(form.get("amount") as string),
        network: form.get("network") as string,
        txHash: form.get("txHash") as string,
        notes: (form.get("notes") as string) || undefined,
      });
      setMessage(result.success ? { type: "success", text: "Deposit submitted — awaiting admin approval." } : { type: "error", text: (result as any).error });
      if (result.success) (e.target as HTMLFormElement).reset();
    });
  }

  function handleWithdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestWithdrawal({
        amount: parseFloat(form.get("amount") as string),
        network: form.get("withdrawNetwork") as string,
        address: form.get("address") as string,
      });
      setMessage(result.success ? { type: "success", text: "Withdrawal request submitted." } : { type: "error", text: (result as any).error });
      if (result.success) (e.target as HTMLFormElement).reset();
    });
  }

  const isIn = (type: string) => type === "DEPOSIT" || type === "ALLOCATION_IN";
  const balance = wallet?.balance ?? 0;
  const allocated = stats.allocated;
  const pending = stats.pendingDeposits;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Institutional Wallet</h1>
        <p className="text-[13px] text-[#555] mt-1">Global liquid assets and cross-network trade allocations.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Available", value: formatCurrency(balance), sub: "LIQUID", sub2: "USDT · Available now", valueColor: "text-white" },
          { label: "Allocated", value: formatCurrency(allocated), sub: "Active Investments", sub2: `LOCKED · ${stats.activeInvestmentCount} Active`, valueColor: "text-white" },
          { label: "Pending", value: formatCurrency(pending), sub: "Awaiting Approval", sub2: "INBOUND · Deposits", valueColor: "text-white" },
        ].map(({ label, value, sub, sub2, valueColor }) => (
          <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-3">{label}</div>
            <div className={`text-[22px] font-bold mb-1 ${valueColor}`}>{value}</div>
            <div className="text-[12px] text-[#22c55e]">{sub}</div>
            <div className="text-[10px] text-[#444] mt-1 uppercase tracking-wider">{sub2}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Institutional Vaulting */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1e1e1e]">
            <h2 className="text-[15px] font-semibold text-[#f0b429] mb-2">Institutional Vaulting</h2>
            <p className="text-[13px] text-[#555] mb-4">
              Secure assets via MPC multi-signature technology and audited liquidity reserves. We maintain a verified 1:1 reserve ratio.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[#22c55e] text-[11px] font-semibold">
                <CheckCircle size={13} /> INSURED
              </div>
              <div className="flex items-center gap-1.5 text-[#22c55e] text-[11px] font-semibold">
                <Shield size={13} /> AUDITED
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-[14px] font-semibold text-white">Transaction History</h3>
              <div className="flex gap-3 text-[11px]">
                {["ALL", "DEPOSITS", "WITHDRAWALS"].map((f) => (
                  <button key={f} type="button" className={`font-medium tracking-wider ${f === "ALL" ? "text-[#f0b429]" : "text-[#555] hover:text-white"}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-[12px] min-w-[480px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Date", "Type", "Amount", "Network", "Status", "Details"].map((h) => (
                    <th key={h} className="text-left pb-2 text-[#555] font-medium uppercase text-[9px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-2.5 text-[#888]">{formatDate(tx.createdAt)}</td>
                    <td className="py-2.5">
                      <span className={isIn(tx.type) ? "text-[#22c55e]" : tx.status === "PENDING" ? "text-[#f0b429]" : "text-[#888]"}>
                        {tx.type.charAt(0) + tx.type.slice(1).toLowerCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-white font-medium">{formatCurrency(tx.amount)} USDT</td>
                    <td className="py-2.5 text-[#888]">{tx.network ?? "—"}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === "COMPLETED" ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : tx.status === "PENDING" ? "bg-[#f0b429]/10 text-[#f0b429]"
                        : "bg-[#ef4444]/10 text-[#ef4444]"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#f0b429] cursor-pointer text-[11px]">↗</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-[#555]">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Right: Deposit panel */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-[15px] font-semibold text-white">Deposit Funds</h2>

          {/* Tabs */}
          <div className="flex border-b border-[#1e1e1e]">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTab(t); setMessage(null); }}
                className={`flex-1 pb-2.5 text-[12px] font-semibold capitalize transition-colors ${
                  tab === t ? "text-[#f0b429] border-b-2 border-[#f0b429]" : "text-[#555] hover:text-white"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-[12px] ${message.type === "success" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
              {message.text}
            </div>
          )}

          {tab === "deposit" ? (
            <div className="space-y-4">
              {/* Network selector */}
              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Select Network</div>
                <select
                  aria-label="Network"
                  value={network}
                  onChange={(e) => { setNetwork(e.target.value as NetworkKey); setCopied(false); }}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#f0b429]/50"
                >
                  {NETWORKS.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              {/* Address display */}
              {currentAddress ? (
                <>
                  <div>
                    <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">
                      Send {network === "BTC" ? "BTC" : "USDT"} to this address
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[11px] text-[#ccc] font-mono break-all">
                        {currentAddress}
                      </div>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#f0b429]/50 transition-colors shrink-0"
                      >
                        {copied
                          ? <CheckCircle size={14} className="text-[#22c55e]" />
                          : <Copy size={14} className="text-[#888]" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-[10px] text-[#22c55e] mt-1">Address copied!</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] rounded-lg">
                    <span className="text-[#f0b429] mt-0.5 text-[12px]">ⓘ</span>
                    <p className="text-[11px] text-[#555]">
                      Send only <strong className="text-white">{network === "BTC" ? "BTC" : `USDT on the ${network} network`}</strong> to
                      this address. Sending the wrong asset or network will result in permanent loss of funds.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-center">
                  <p className="text-[12px] text-[#555]">
                    Deposit address for this network is not yet configured.
                    Please contact support or choose a different network.
                  </p>
                </div>
              )}

              {/* Manual deposit confirmation form */}
              <form onSubmit={handleDeposit} className="space-y-3 border-t border-[#1e1e1e] pt-4">
                <div className="text-[10px] text-[#555] uppercase tracking-wider">After sending — confirm your deposit</div>
                <input name="amount" type="number" min="1000" step="0.01" required placeholder="Amount sent (min $1,000)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
                <input name="network" type="hidden" value={network} />
                <input name="txHash" type="text" required placeholder="Transaction Hash / TXID"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 font-mono" />
                <input name="notes" type="text" placeholder="Notes (optional)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
                <button type="submit" disabled={isPending || !currentAddress}
                  className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-40 text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                  {isPending ? "Submitting…" : "Confirm Deposit"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Amount</div>
                <input
                  name="amount"
                  type="number"
                  min="1000"
                  max={wallet?.balance}
                  step="0.01"
                  required
                  placeholder={`Min $1,000 — Available: ${formatCurrency(wallet?.balance ?? 0)}`}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50"
                />
              </div>

              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Network</div>
                <select
                  name="withdrawNetwork"
                  required
                  aria-label="Withdrawal network"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#f0b429]/50"
                >
                  <option value="">Select network…</option>
                  {NETWORKS.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Destination Address</div>
                <input
                  name="address"
                  type="text"
                  required
                  placeholder="Your wallet address"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 font-mono"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] rounded-lg">
                <span className="text-[#f0b429] text-[12px]">ⓘ</span>
                <p className="text-[11px] text-[#555]">Withdrawals are reviewed and processed within 24h. Ensure the address matches the selected network.</p>
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                {isPending ? "Submitting…" : "Request Withdrawal"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
