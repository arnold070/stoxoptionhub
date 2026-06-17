import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAllInvestments, createInvestmentPlan, toggleInvestmentPlan } from "@/lib/actions/investments";
import { prisma } from "@/lib/prisma";
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

export default async function AdminInvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const tab = sp.tab ?? "investments";
  const page = parseInt(sp.page ?? "1", 10);

  const [allInvestments, plans] = await Promise.all([
    getAllInvestments({ page }),
    prisma.investmentPlan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Investment Management</h1>
          <p className="text-[13px] text-[#555] mt-1">Manage plans and review user investments.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {adminNav.map(({ label, href }) => (
            <Link key={href} href={href} className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-[#1e1e1e] gap-4">
        {[
          { key: "investments", label: "User Investments" },
          { key: "plans", label: "Investment Plans" },
          { key: "create", label: "+ Create Plan" },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/investments?tab=${key}`}
            className={`pb-2.5 text-[13px] font-semibold transition-colors ${
              tab === key ? "text-[#f0b429] border-b-2 border-[#f0b429]" : "text-[#555] hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "investments" && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["User", "Plan", "Amount", "Payout", "Start", "End", "Status"].map((h) => (
                    <th key={h} className="text-left p-4 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allInvestments.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="p-4">
                      <div className="text-white font-medium">{inv.user?.name}</div>
                      <div className="text-[11px] text-[#555]">{inv.user?.email}</div>
                    </td>
                    <td className="p-4 text-white">{inv.plan.name}</td>
                    <td className="p-4 text-white font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="p-4 text-[#22c55e] font-semibold">{formatCurrency(inv.expectedPayout)}</td>
                    <td className="p-4 text-[#888]">{formatDate(inv.startDate)}</td>
                    <td className="p-4 text-[#888]">{formatDate(inv.endDate)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === "ACTIVE" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                        inv.status === "COMPLETED" ? "bg-[#f0b429]/10 text-[#f0b429]" :
                        "bg-[#555]/10 text-[#555]"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {allInvestments.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-[#555]">No investments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[15px] font-semibold text-white">{plan.name}</div>
                <div className="text-[12px] text-[#555] mt-0.5">
                  {plan.durationDays}d · Min {formatCurrency(plan.minAmount)} · ROI: {plan.roiPercent}%
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${plan.isActive ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#555]/10 text-[#555]"}`}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
                <form action={async () => { "use server"; await toggleInvestmentPlan(plan.id); }}>
                  <button type="submit" className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors">
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-center text-[#555] py-8">No plans yet. Create one using the tab above.</p>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="max-w-lg">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6">
            <h2 className="text-[16px] font-semibold text-white mb-4">Create Investment Plan</h2>
            <form
              action={async (fd: FormData) => {
                "use server";
                await createInvestmentPlan({
                  name: fd.get("name") as string,
                  description: fd.get("description") as string,
                  minAmount: parseFloat(fd.get("minAmount") as string),
                  durationDays: parseInt(fd.get("durationDays") as string, 10),
                  roiPercent: parseFloat(fd.get("roiPercent") as string),
                });
              }}
              className="space-y-4"
            >
              {[
                { name: "name", label: "Plan Name", type: "text", placeholder: "Alpha Momentum" },
                { name: "description", label: "Description", type: "text", placeholder: "Momentum-based strategy..." },
                { name: "minAmount", label: "Minimum Amount ($)", type: "number", placeholder: "100" },
                { name: "durationDays", label: "Duration (days)", type: "number", placeholder: "30" },
                { name: "roiPercent", label: "ROI % (informational)", type: "number", placeholder: "8.5" },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    name={name}
                    type={type}
                    required
                    placeholder={placeholder}
                    step={type === "number" ? "0.01" : undefined}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
                  />
                </div>
              ))}
              <button type="submit" className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] text-black font-bold text-[13px] rounded-lg uppercase tracking-wide transition-colors">
                Create Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
