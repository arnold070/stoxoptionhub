import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAuditLogs } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const adminNav = [
  { label: "Admin", href: "/admin" },
  { label: "Deposits", href: "/admin/deposits" },
  { label: "Withdrawals", href: "/admin/withdrawals" },
  { label: "Ledger", href: "/admin/transactions" },
  { label: "Investments", href: "/admin/investments" },
  { label: "Audit Log", href: "/admin/audit-logs" },
];

const actionColor = (action: string) => {
  if (action.includes("APPROVE")) return "text-[#22c55e]";
  if (action.includes("REJECT") || action.includes("SUSPEND")) return "text-[#ef4444]";
  if (action.includes("UPDATE") || action.includes("ROLE")) return "text-[#f0b429]";
  return "text-[#888]";
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);
  const logs = await getAuditLogs({ page });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-[13px] text-[#555] mt-1">Complete immutable record of all admin actions.</p>
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
          <table className="w-full text-[13px] min-w-[600px]">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {["Date", "Admin", "Action", "Entity", "Entity ID", "Details"].map((h) => (
                  <th key={h} className="text-left p-4 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="p-4 text-[#888] whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="p-4">
                    <div className="text-white font-medium">{log.user?.name ?? "System"}</div>
                    <div className="text-[11px] text-[#555]">{log.user?.email ?? ""}</div>
                  </td>
                  <td className={`p-4 font-semibold text-[11px] tracking-wider ${actionColor(log.action)}`}>
                    {log.action.replace(/_/g, " ")}
                  </td>
                  <td className="p-4 text-[#888]">{log.entity}</td>
                  <td className="p-4 text-[#555] font-mono text-[11px] max-w-[100px] truncate">
                    {log.entityId ?? "—"}
                  </td>
                  <td className="p-4 text-[#555] text-[12px] max-w-[160px] truncate">
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555]">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`/admin/audit-logs?page=${page - 1}`} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            ← Previous
          </Link>
        )}
        {logs.length === 20 && (
          <Link href={`/admin/audit-logs?page=${page + 1}`} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
