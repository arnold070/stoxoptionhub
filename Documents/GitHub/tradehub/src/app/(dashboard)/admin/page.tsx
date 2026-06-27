export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getEnhancedPlatformStats,
  getPendingTransactions,
  approveTransaction,
  rejectTransaction,
  getDashboardActivity,
} from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingDown,
  Layers,
  Activity,
  Banknote,
  TrendingUp,
  UserPlus,
  Shield,
  Wallet,
} from "lucide-react";
import Link from "next/link";


function timeSince(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return formatDate(date);
}

const ACTION_LABEL: Record<string, string> = {
  UPDATE_USER_PROFILE: "Updated user profile",
  BAN_USER: "Banned a user",
  UNBAN_USER: "Unbanned a user",
  SUSPEND_USER: "Suspended a user",
  UNSUSPEND_USER: "Unsuspended a user",
  SOFT_DELETE_USER: "Deleted a user",
  RESTORE_USER: "Restored a user",
  SET_ADMIN_NOTE: "Set admin note",
  ADMIN_RESET_PASSWORD: "Reset user password",
  ADMIN_CREATE_USER: "Created a new user",
  ADMIN_CREDIT_WALLET: "Credited wallet",
  ADMIN_DEBIT_WALLET: "Debited wallet",
  APPROVE_TRANSACTION: "Approved transaction",
  REJECT_TRANSACTION: "Rejected transaction",
  UPDATE_SITE_CONFIG: "Updated site config",
  UPSERT_CMS_PAGE: "Updated CMS page",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [stats, pendingTx, activity] = await Promise.all([
    getEnhancedPlatformStats(),
    getPendingTransactions(),
    getDashboardActivity(),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
          <p className="text-[13px] text-[#555] mt-1">Platform-wide metrics and pending actions</p>
        </div>
        <Link
          href="/admin/users?status=all"
          className="text-[12px] font-medium text-[#f0b429] hover:opacity-80 transition-opacity"
        >
          View all users →
        </Link>
      </div>

      {stats && (
        <>
          {/* Row 1 — Users */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Users",     value: stats.totalUsers,     icon: Users,       color: "text-[#818cf8]", bg: "bg-[#818cf8]/10" },
              { label: "Active Accounts", value: stats.activeUsers,    icon: Activity,    color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
              { label: "Suspended",       value: stats.suspendedUsers, icon: AlertCircle, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
              { label: "New Today",       value: activity.newUsersToday, icon: UserPlus,  color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Deposited",    value: formatCurrency(stats.totalDepositsRevenue),  icon: DollarSign,   color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", sub: `${stats.depositCount} approved` },
              { label: "Pending Deposits",   value: stats.pendingDeposits,                        icon: Clock,        color: "text-[#f0b429]", bg: "bg-[#f0b429]/10", sub: "awaiting review" },
              { label: "Total Withdrawn",    value: formatCurrency(stats.totalWithdrawalsAmount), icon: TrendingDown, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", sub: `${stats.withdrawalCount} approved` },
              { label: "Platform Balance",   value: formatCurrency(activity.totalBalance),        icon: Wallet,       color: "text-[#818cf8]", bg: "bg-[#818cf8]/10", sub: "all wallets combined" },
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

          {/* Row 3 — AUM + platform */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "AUM (Active)",        value: formatCurrency(stats.aum),        icon: Banknote,   color: "text-[#818cf8]", bg: "bg-[#818cf8]/10", sub: `${stats.totalInvestments} investments` },
              { label: "Active Members",      value: stats.activeMembers,              icon: Layers,     color: "text-[#f0b429]", bg: "bg-[#f0b429]/10", sub: "paid memberships" },
              { label: "Active Strategies",   value: stats.activeStrategies,           icon: TrendingUp, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", sub: "copy trading" },
              { label: "Published Content",   value: stats.publishedContent,           icon: Shield,     color: "text-[#888]",    bg: "bg-[#888]/10",    sub: "lessons & resources" },
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
        </>
      )}

      {/* Two-column: Pending Queue + Activity Feed */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Pending queue */}
        <div className="lg:col-span-3">
          <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
              <AlertCircle size={15} className="text-[#f0b429]" />
              <h2 className="font-semibold text-white text-[14px]">Pending Queue</h2>
              {pendingTx.length > 0 && (
                <span className="text-[10px] bg-[#f0b429]/10 text-[#f0b429] px-2 py-0.5 rounded-full font-bold">{pendingTx.length}</span>
              )}
            </div>
            {pendingTx.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[460px]">
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
                            <form action={async () => { "use server"; await approveTransaction(tx.id); revalidatePath("/admin"); }}>
                              <button type="submit" className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#22c55e]/20 transition-colors">Approve</button>
                            </form>
                            <form action={async () => { "use server"; await rejectTransaction(tx.id); revalidatePath("/admin"); }}>
                              <button type="submit" className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#ef4444]/20 transition-colors">Reject</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Activity size={28} className="text-[#333] mx-auto mb-3" />
                <p className="text-[#555] text-[13px]">Queue is clear — no pending transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
              <Shield size={15} className="text-[#818cf8]" />
              <h2 className="font-semibold text-white text-[14px]">Recent Activity</h2>
            </div>
            {activity.logs.length > 0 ? (
              <div className="divide-y divide-[#1a1a1a] max-h-[480px] overflow-y-auto">
                {activity.logs.map((log) => (
                  <div key={log.id} className="px-5 py-3">
                    <p className="text-[12px] text-[#ccc]">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-[#555]">
                        {log.user ? log.user.name : "System"}
                        {log.details ? ` · ${log.details.slice(0, 40)}` : ""}
                      </p>
                      <span className="text-[10px] text-[#444] shrink-0 ml-2">{timeSince(log.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-[#555] text-[13px]">No activity yet</p>
              </div>
            )}
            <div className="p-3 border-t border-[#1a1a1a]">
              <Link href="/admin/audit-logs" className="text-[11px] text-[#555] hover:text-[#f0b429] transition-colors">
                View full audit log →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
