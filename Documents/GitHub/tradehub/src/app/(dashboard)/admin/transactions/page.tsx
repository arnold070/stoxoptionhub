import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAllTransactions } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const adminNav = [
  { label: "Admin", href: "/admin" },
  { label: "Deposits", href: "/admin/deposits" },
  { label: "Withdrawals", href: "/admin/withdrawals" },
  { label: "Ledger", href: "/admin/transactions" },
  { label: "Investments", href: "/admin/investments" },
  { label: "Audit Log", href: "/admin/audit-logs" },
];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);
  const transactions = await getAllTransactions({ page });

  const typeColor = (type: string) => {
    if (type === "DEPOSIT" || type === "PAYOUT" || type === "ALLOCATION_IN") return "text-[#22c55e]";
    if (type === "WITHDRAWAL" || type === "ALLOCATION_OUT" || type === "INVESTMENT") return "text-[#ef4444]";
    return "text-[#888]";
  };

  const statusColor = (s: string) => {
    if (s === "APPROVED" || s === "COMPLETED") return "bg-[#22c55e]/10 text-[#22c55e]";
    if (s === "REJECTED") return "bg-[#ef4444]/10 text-[#ef4444]";
    return "bg-[#f0b429]/10 text-[#f0b429]";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Ledger</h1>
          <p className="text-[13px] text-[#555] mt-1">Full immutable record of all platform transactions.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {adminNav.map(({ label, href }) => (
            <Link key={href} href={href} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {["Date", "User", "Type", "Amount", "Status", "Description"].map((h) => (
                  <th key={h} className="text-left p-4 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="p-4 text-[#888] whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{tx.user?.name}</div>
                    <div className="text-[11px] text-[#555]">{tx.user?.email}</div>
                  </td>
                  <td className={`p-4 font-semibold ${typeColor(tx.type)}`}>
                    {tx.type.replace(/_/g, " ")}
                  </td>
                  <td className="p-4 font-semibold text-white">{formatCurrency(tx.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#555] text-[12px] max-w-[200px] truncate">
                    {tx.description ?? "—"}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555]">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`/admin/transactions?page=${page - 1}`} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            ← Previous
          </Link>
        )}
        {transactions.length === 20 && (
          <Link href={`/admin/transactions?page=${page + 1}`} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
