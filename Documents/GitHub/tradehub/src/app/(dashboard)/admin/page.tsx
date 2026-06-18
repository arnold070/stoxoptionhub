import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getEnhancedPlatformStats, getPendingTransactions, approveTransaction, rejectTransaction } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Clock, DollarSign, AlertCircle, TrendingDown, Layers, Activity, Banknote, TrendingUp } from "lucide-react";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [stats, pendingTx] = await Promise.all([
    getEnhancedPlatformStats(),
    getPendingTransactions(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-[13px] text-[#555] mt-1">Platform-wide metrics and pending actions</p>
      </div>

      {stats && (
        <>
          {/* Row 1 — Users */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Users",     value: stats.totalUsers,     icon: Users,       color: "text-[#818cf8]", bg: "bg-[#818cf8]/10" },
              { label: "Active Accounts", value: stats.activeUsers,    icon: Activity,    color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
              { label: "Suspended",       value: stats.suspendedUsers, icon: AlertCircle, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
              { label: "Active Members",  value: stats.activeMembers,  icon: Layers,      color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#888] uppercase tracking-wider">{label}</span>
                  <span className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></span>
                </div>
                <p className="text-[24px] font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Row 2 — Financials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Deposited",  value: formatCurrency(stats.totalDepositsRevenue),  icon: DollarSign,   color: "text-[#22c55e]", bg: "bg-[#22c55e]/10",  sub: `${stats.depositCount} approved` },
              { label: "Pending Deposits", value: stats.pendingDeposits,                        icon: Clock,        color: "text-[#f0b429]", bg: "bg-[#f0b429]/10",  sub: "awaiting review" },
              { label: "Total Withdrawn",  value: formatCurrency(stats.totalWithdrawalsAmount), icon: TrendingDown, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10",  sub: `${stats.withdrawalCount} approved` },
              { label: "AUM (Active)",     value: formatCurrency(stats.aum),                    icon: Banknote,     color: "text-[#818cf8]", bg: "bg-[#818cf8]/10",  sub: `${stats.totalInvestments} investments` },
            ].map(({ label, value, icon: Icon, color, bg, sub }) => (
              <div key={label} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#888] uppercase tracking-wider">{label}</span>
                  <span className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></span>
                </div>
                <p className="text-[20px] font-bold text-white">{value}</p>
                <p className="text-[10px] text-[#444] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Platform summary row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Active Strategies", value: stats.activeStrategies, icon: TrendingUp },
              { label: "Published Content",  value: stats.publishedContent, icon: Layers },
              { label: "Active Plans",       value: stats.activePlans,      icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e] flex items-center gap-3">
                <div className="p-2 bg-[#1a1a1a] rounded-lg shrink-0">
                  <Icon size={14} className="text-[#f0b429]" />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-white leading-none">{value}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pending queue */}
      {pendingTx.length > 0 && (
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
            <AlertCircle size={15} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Pending Queue</h2>
            <span className="text-[10px] bg-[#f0b429]/10 text-[#f0b429] px-2 py-0.5 rounded-full font-bold">{pendingTx.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead>
                <tr className="border-b border-[#1e1e1e] text-left">
                  {["User", "Type", "Amount", "Date", "Actions"].map((h) => (
                    <th key={h} className="p-4 font-medium text-[#555] uppercase text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414]">
                    <td className="p-4">
                      <p className="font-medium text-white">{(tx as any).user.name}</p>
                      <p className="text-[11px] text-[#555]">{(tx as any).user.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        tx.type === "DEPOSIT" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#f0b429]/10 text-[#f0b429]"
                      }`}>{tx.type.toLowerCase()}</span>
                    </td>
                    <td className="p-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                    <td className="p-4 text-[#555]">{formatDate(tx.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await approveTransaction(tx.id); }}>
                          <button type="submit" className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#22c55e]/20 transition-colors">Approve</button>
                        </form>
                        <form action={async () => { "use server"; await rejectTransaction(tx.id); }}>
                          <button type="submit" className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#ef4444]/20 transition-colors">Reject</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingTx.length === 0 && (
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
          <Activity size={28} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#555] text-[13px]">No pending transactions — queue is clear</p>
        </div>
      )}
    </div>
  );
}
