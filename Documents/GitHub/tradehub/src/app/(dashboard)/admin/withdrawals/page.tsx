import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getWithdrawalRequests, approveTransaction, rejectTransaction } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const status = sp.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const page = parseInt(sp.page ?? "1", 10);

  const withdrawals = await getWithdrawalRequests({ status, page });

  const statusColor = (s: string) => {
    if (s === "APPROVED") return "bg-[#22c55e]/10 text-[#22c55e]";
    if (s === "REJECTED") return "bg-[#ef4444]/10 text-[#ef4444]";
    return "bg-[#f0b429]/10 text-[#f0b429]";
  };

  const adminNav = [
    { label: "Admin", href: "/admin" },
    { label: "Deposits", href: "/admin/deposits" },
    { label: "Withdrawals", href: "/admin/withdrawals" },
    { label: "Ledger", href: "/admin/transactions" },
    { label: "Investments", href: "/admin/investments" },
    { label: "Audit Log", href: "/admin/audit-logs" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-[13px] text-[#555] mt-1">
            Review pending withdrawals. Funds are already reserved — approving releases them on-chain, rejecting returns them to the user wallet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {adminNav.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", href: "/admin/withdrawals" },
          { label: "Pending", href: "/admin/withdrawals?status=PENDING" },
          { label: "Approved", href: "/admin/withdrawals?status=APPROVED" },
          { label: "Rejected", href: "/admin/withdrawals?status=REJECTED" },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              (!status && label === "All") || status === label.toUpperCase()
                ? "bg-[#f0b429]/10 text-[#f0b429] border border-[#f0b429]/20"
                : "bg-[#1a1a1a] text-[#555] hover:text-white border border-[#2a2a2a]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Reserved funds notice */}
      {withdrawals.some((w) => w.status === "PENDING") && (
        <div className="flex items-start gap-3 p-4 bg-[#f0b429]/5 border border-[#f0b429]/20 rounded-xl">
          <span className="text-[#f0b429] text-[14px] mt-0.5">ⓘ</span>
          <p className="text-[13px] text-[#888]">
            Pending withdrawal funds are already deducted from user wallet balances.
            Approving marks the withdrawal as executed; rejecting returns the funds immediately.
          </p>
        </div>
      )}

      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {["Date", "User", "Amount", "Destination Address", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left p-4 text-[#555] font-medium uppercase text-[10px] tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="p-4 text-[#888]">{formatDate(w.createdAt)}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{w.user?.name}</div>
                    <div className="text-[11px] text-[#555]">{w.user?.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-white">{formatCurrency(w.amount)}</td>
                  <td className="p-4 text-[#888] font-mono text-[11px] max-w-[180px] truncate">
                    {w.txHash ?? "—"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {w.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await approveTransaction(w.id); }}>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] text-[11px] font-bold rounded-lg transition-colors border border-[#22c55e]/20"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={async () => { "use server"; await rejectTransaction(w.id); }}>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-[11px] font-bold rounded-lg transition-colors border border-[#ef4444]/20"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                    {w.status !== "PENDING" && w.adminNote && (
                      <span className="text-[11px] text-[#555] italic">{w.adminNote}</span>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555]">
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={`/admin/withdrawals?${status ? `status=${status}&` : ""}page=${page - 1}`}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white"
          >
            ← Previous
          </Link>
        )}
        {withdrawals.length === 20 && (
          <Link
            href={`/admin/withdrawals?${status ? `status=${status}&` : ""}page=${page + 1}`}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
