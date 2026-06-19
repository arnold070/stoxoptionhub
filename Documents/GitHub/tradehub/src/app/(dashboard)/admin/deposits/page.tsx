import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getDepositRequests, approveTransaction, rejectTransaction } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const status = sp.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const page = parseInt(sp.page ?? "1", 10);

  const deposits = await getDepositRequests({ status, page });

  const statusColor = (s: string) => {
    if (s === "APPROVED") return "bg-[#22c55e]/10 text-[#22c55e]";
    if (s === "REJECTED") return "bg-[#ef4444]/10 text-[#ef4444]";
    return "bg-[#f0b429]/10 text-[#f0b429]";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit Requests</h1>
          <p className="text-[13px] text-[#555] mt-1">Review and approve or reject user deposit submissions.</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Admin", href: "/admin" },
            { label: "Deposits", href: "/admin/deposits" },
            { label: "Withdrawals", href: "/admin/withdrawals" },
            { label: "Ledger", href: "/admin/transactions" },
            { label: "Investments", href: "/admin/investments" },
            { label: "Audit Log", href: "/admin/audit-logs" },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", href: "/admin/deposits" },
          { label: "Pending", href: "/admin/deposits?status=PENDING" },
          { label: "Approved", href: "/admin/deposits?status=APPROVED" },
          { label: "Rejected", href: "/admin/deposits?status=REJECTED" },
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

      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {["Date", "User", "Amount", "Network", "TXID", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left p-4 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deposits.map((dep) => (
                <tr key={dep.id} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="p-4 text-[#888]">{formatDate(dep.createdAt)}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{dep.user?.name}</div>
                    <div className="text-[11px] text-[#555]">{dep.user?.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-white">{formatCurrency(dep.amount)}</td>
                  <td className="p-4 text-[#888]">{dep.network ?? "—"}</td>
                  <td className="p-4 text-[#888] font-mono text-[11px] max-w-[120px] truncate">
                    {dep.txHash ?? "—"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(dep.status)}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {dep.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await approveTransaction(dep.id); revalidatePath("/admin/deposits"); revalidatePath("/admin"); }}>
                          <button type="submit" className="px-3 py-1 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] text-[11px] font-bold rounded-lg transition-colors border border-[#22c55e]/20">
                            Approve
                          </button>
                        </form>
                        <form action={async () => { "use server"; await rejectTransaction(dep.id); revalidatePath("/admin/deposits"); revalidatePath("/admin"); }}>
                          <button type="submit" className="px-3 py-1 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-[11px] font-bold rounded-lg transition-colors border border-[#ef4444]/20">
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                    {dep.status !== "PENDING" && dep.adminNote && (
                      <span className="text-[11px] text-[#555] italic">{dep.adminNote}</span>
                    )}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#555]">No deposits found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`/admin/deposits?${status ? `status=${status}&` : ""}page=${page - 1}`}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            ← Previous
          </Link>
        )}
        {deposits.length === 20 && (
          <Link href={`/admin/deposits?${status ? `status=${status}&` : ""}page=${page + 1}`}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
