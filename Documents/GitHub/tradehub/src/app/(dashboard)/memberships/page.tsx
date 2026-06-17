import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getPlans, getUserMemberships, purchaseMembership, cancelMembership } from "@/lib/actions/memberships";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, Zap } from "lucide-react";

const PLAN_ACCENTS: Record<string, { border: string; badge: string; btn: string }> = {
  Starter:    { border: "border-[#2a2a2a]",       badge: "bg-[#1e1e1e] text-[#888]",        btn: "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]" },
  "Pro Trader": { border: "border-[#f0b429]/40",  badge: "bg-[#f0b429]/10 text-[#f0b429]",  btn: "bg-[#f0b429] hover:bg-[#e0a424] text-black" },
  Elite:      { border: "border-[#818cf8]/40",    badge: "bg-[#818cf8]/10 text-[#818cf8]",  btn: "bg-[#818cf8] hover:bg-[#6366f1] text-white" },
};

export default async function MembershipsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [plans, memberships] = await Promise.all([getPlans(), getUserMemberships()]);
  const activeMembership = memberships.find((m) => m.status === "ACTIVE");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentorship Plans</h1>
          <p className="text-[13px] text-[#555] mt-1">Choose a plan to unlock premium features and mentorship access.</p>
        </div>
        {activeMembership && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#111] border border-[#22c55e]/30 rounded-xl flex-wrap">
            <CheckCircle size={15} className="text-[#22c55e]" />
            <div>
              <div className="text-[13px] font-semibold text-[#22c55e]">
                Active: {(activeMembership as any).plan.name}
              </div>
              {(activeMembership as any).endDate && (
                <div className="text-[11px] text-[#22c55e]/60">
                  Expires {formatDate((activeMembership as any).endDate)}
                </div>
              )}
            </div>
            <form action={async () => { "use server"; await cancelMembership({ membershipId: activeMembership.id }); }}>
              <button type="submit" className="ml-4 text-[11px] text-[#ef4444]/70 hover:text-[#ef4444] transition-colors">
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = activeMembership && (activeMembership as any).planId === plan.id;
          const benefits: string[] = JSON.parse(plan.benefits);
          const accent = PLAN_ACCENTS[plan.name] ?? PLAN_ACCENTS["Starter"];

          return (
            <div key={plan.id} className={`bg-[#111] border ${accent.border} rounded-xl p-6 flex flex-col`}>
              {isCurrent && (
                <div className={`inline-flex items-center gap-1.5 self-start mb-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}>
                  <Zap size={10} /> Current Plan
                </div>
              )}
              <h3 className="text-[18px] font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-[12px] text-[#555] mb-4">{plan.description}</p>
              <div className="mb-5">
                <span className="text-[32px] font-bold text-white">{formatCurrency(plan.price)}</span>
                {plan.duration && <span className="text-[13px] text-[#555]">/{plan.duration}d</span>}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12px] text-[#888]">
                    <CheckCircle size={13} className="text-[#22c55e] mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <form action={async () => { "use server"; await purchaseMembership({ planId: plan.id }); }}>
                  <button type="submit" className={`w-full py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-colors ${accent.btn}`}>
                    Get {plan.name}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* History */}
      {memberships.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold text-white mb-4">Membership History</h2>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-x-auto">
            <table className="w-full text-[13px] min-w-[420px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Plan", "Status", "Amount", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="px-5 py-3 font-semibold text-white">{(m as any).plan.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        m.status === "ACTIVE"   ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : m.status === "EXPIRED" ? "bg-[#333] text-[#666]"
                        : "bg-[#ef4444]/10 text-[#ef4444]"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#aaa]">{formatCurrency(m.amount)}</td>
                    <td className="px-5 py-3 text-[#555]">{formatDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
