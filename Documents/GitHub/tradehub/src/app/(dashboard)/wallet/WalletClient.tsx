"use client";

import { useState, useTransition } from "react";
import { requestDeposit, requestWithdrawal } from "@/lib/actions/wallet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Copy, Shield, CheckCircle } from "lucide-react";

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
}

const DEMO_ADDRESS = "TXm6Zp8uT7Z2rK8s4vN9wQmR3Lk2Pj7Yc";
const DEMO_QR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23fff'/%3E%3Crect x='10' y='10' width='40' height='40' fill='%23000'/%3E%3Crect x='15' y='15' width='30' height='30' fill='%23fff'/%3E%3Crect x='20' y='20' width='20' height='20' fill='%23000'/%3E%3Crect x='70' y='10' width='40' height='40' fill='%23000'/%3E%3Crect x='75' y='15' width='30' height='30' fill='%23fff'/%3E%3Crect x='80' y='20' width='20' height='20' fill='%23000'/%3E%3Crect x='10' y='70' width='40' height='40' fill='%23000'/%3E%3Crect x='15' y='75' width='30' height='30' fill='%23fff'/%3E%3Crect x='20' y='80' width='20' height='20' fill='%23000'/%3E%3Crect x='55' y='55' width='10' height='10' fill='%23000'/%3E%3Crect x='70' y='55' width='10' height='10' fill='%23000'/%3E%3Crect x='85' y='55' width='10' height='10' fill='%23000'/%3E%3Crect x='100' y='55' width='10' height='10' fill='%23000'/%3E%3Crect x='55' y='70' width='10' height='10' fill='%23000'/%3E%3Crect x='85' y='70' width='10' height='10' fill='%23000'/%3E%3Crect x='55' y='85' width='10' height='10' fill='%23000'/%3E%3Crect x='70' y='85' width='10' height='10' fill='%23000'/%3E%3Crect x='85' y='85' width='10' height='10' fill='%23000'/%3E%3Crect x='55' y='100' width='10' height='10' fill='%23000'/%3E%3Crect x='85' y='100' width='10' height='10' fill='%23000'/%3E%3Crect x='100' y='100' width='10' height='10' fill='%23000'/%3E%3C/svg%3E";

export default function WalletClient({ wallet, transactions, stats }: Props) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(DEMO_ADDRESS);
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
      const result = await requestWithdrawal({ amount: parseFloat(form.get("amount") as string), address: form.get("address") as string });
      setMessage(result.success ? { type: "success", text: "Withdrawal request submitted." } : { type: "error", text: (result as any).error });
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
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Network Selection</div>
                <select aria-label="Network" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none">
                  <option>USDT (TRC20)</option>
                  <option>USDT (ERC20)</option>
                  <option>BTC</option>
                </select>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img src={DEMO_QR} alt="Deposit QR" width={120} height={120} />
              </div>
              <p className="text-[10px] text-center text-[#555] uppercase tracking-widest">Scan to Initiate Transfer</p>

              {/* Address */}
              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Your Receiving Address</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[11px] text-[#888] font-mono truncate">
                    {DEMO_ADDRESS.slice(0, 20)}…
                  </div>
                  <button type="button" onClick={copyAddress} className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#f0b429]/50 transition-colors">
                    {copied ? <CheckCircle size={14} className="text-[#22c55e]" /> : <Copy size={14} className="text-[#888]" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] rounded-lg">
                <span className="text-[#f0b429] mt-0.5 text-[12px]">ⓘ</span>
                <p className="text-[11px] text-[#555]">Send only USDT. Other assets will be permanently lost.</p>
              </div>

              {/* Manual deposit form */}
              <form onSubmit={handleDeposit} className="space-y-3 border-t border-[#1e1e1e] pt-4">
                <div className="text-[10px] text-[#555] uppercase tracking-wider">Submit your deposit details</div>
                <input name="amount" type="number" min="10" step="0.01" required placeholder="Amount (min $10)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
                <select name="network" required aria-label="Network"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white outline-none focus:border-[#f0b429]/50 appearance-none">
                  <option value="">Select network…</option>
                  <option value="TRC20">USDT (TRC20)</option>
                  <option value="ERC20">USDT (ERC20)</option>
                  <option value="BEP20">USDT (BEP20)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                </select>
                <input name="txHash" type="text" required placeholder="Transaction Hash (TXID)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 font-mono" />
                <input name="notes" type="text" placeholder="Notes (optional)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
                <button type="submit" disabled={isPending}
                  className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                  {isPending ? "Submitting…" : "Submit Deposit"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3">
              <input name="amount" type="number" min="20" max={wallet?.balance} step="0.01" required placeholder="Amount (min $20)"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
              <input name="address" type="text" required placeholder="Destination wallet address"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50" />
              <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] rounded-lg">
                <span className="text-[#f0b429] text-[12px]">ⓘ</span>
                <p className="text-[11px] text-[#555]">Withdrawals are reviewed within 24h. Available balance: {formatCurrency(wallet?.balance ?? 0)}.</p>
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
