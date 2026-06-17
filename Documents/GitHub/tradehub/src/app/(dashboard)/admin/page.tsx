import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getUsers,
  getPendingTransactions,
  getPlatformStats,
  suspendUser,
  unsuspendUser,
  approveTransaction,
  rejectTransaction,
  updateUserRole,
} from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Clock, DollarSign, AlertCircle } from "lucide-react";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [users, pendingTx, stats] = await Promise.all([
    getUsers(),
    getPendingTransactions(),
    getPlatformStats(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-[13px] text-[#555] mt-1">Manage users, transactions, and platform settings</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-[#818cf8]", bg: "bg-[#818cf8]/10" },
            { label: "Active Members", value: stats.activeMembers, icon: DollarSign, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
            { label: "Pending Transactions", value: stats.pendingTxCount, icon: Clock, color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111] rounded-xl p-5 border border-[#1e1e1e]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#888] uppercase tracking-wider">{label}</span>
                <span className={`p-2 rounded-lg ${bg}`}><Icon size={16} className={color} /></span>
              </div>
              <p className="text-[28px] font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending Transactions */}
      {pendingTx.length > 0 && (
        <div className="mb-8 bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
            <AlertCircle size={16} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[15px]">Pending Transactions</h2>
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
                  <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="p-4">
                      <p className="font-medium text-white">{(tx as any).user.name}</p>
                      <p className="text-[11px] text-[#555]">{(tx as any).user.email}</p>
                    </td>
                    <td className="p-4 capitalize text-[#aaa]">
                      {tx.type.toLowerCase().replace(/_/g, " ")}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 text-[#555]">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await approveTransaction(tx.id); }}>
                          <button type="submit" className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#22c55e]/20 transition-colors">
                            Approve
                          </button>
                        </form>
                        <form action={async () => { "use server"; await rejectTransaction(tx.id); }}>
                          <button type="submit" className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-[#ef4444]/20 transition-colors">
                            Reject
                          </button>
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

      {/* Users table */}
      <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
        <div className="p-5 border-b border-[#1e1e1e]">
          <h2 className="font-semibold text-white text-[15px]">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead>
              <tr className="border-b border-[#1e1e1e] text-left">
                {["Name", "Email", "Role", "Membership", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-4 font-medium text-[#555] uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const activePlan = (u as any).memberships?.[0]?.plan?.name;
                return (
                  <tr key={u.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="p-4 font-medium text-white">{u.name}</td>
                    <td className="p-4 text-[#888]">{u.email}</td>
                    <td className="p-4">
                      <form action={async (fd: FormData) => {
                        "use server";
                        await updateUserRole(u.id, fd.get("role") as any);
                      }} className="flex items-center gap-1">
                        <select name="role" defaultValue={u.role} aria-label="User role"
                          className="text-[11px] rounded border border-[#2a2a2a] bg-[#1a1a1a] text-white px-1.5 py-0.5 outline-none">
                          {["VISITOR","MEMBER","MENTOR","TRADER","ADMIN"].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-[11px] text-[#f0b429] hover:opacity-80">
                          Set
                        </button>
                      </form>
                    </td>
                    <td className="p-4 text-[#888]">
                      {activePlan ?? <span className="text-[#444]">None</span>}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {formatCurrency((u as any).wallet?.balance ?? 0)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.isSuspended
                          ? "bg-[#ef4444]/10 text-[#ef4444]"
                          : "bg-[#22c55e]/10 text-[#22c55e]"
                      }`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isSuspended ? (
                        <form action={async () => { "use server"; await unsuspendUser(u.id); }}>
                          <button type="submit" className="text-[11px] text-[#22c55e] hover:opacity-80">
                            Unsuspend
                          </button>
                        </form>
                      ) : (
                        <form action={async () => { "use server"; await suspendUser(u.id); }}>
                          <button type="submit" className="text-[11px] text-[#ef4444] hover:opacity-80">
                            Suspend
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
