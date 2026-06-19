import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getInvestmentPlans, getMyInvestments, purchaseInvestment } from "@/lib/actions/investments";
import { getWallet } from "@/lib/actions/wallet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";

function statusBadge(status: string) {
  if (status === "ACTIVE") return "bg-[#22c55e]/10 text-[#22c55e]";
  if (status === "COMPLETED") return "bg-[#f0b429]/10 text-[#f0b429]";
  return "bg-[#555]/10 text-[#555]";
}

export default async function InvestmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [plans, myInvestments, wallet] = await Promise.all([
    getInvestmentPlans(),
    getMyInvestments(),
    getWallet(),
  ]);

  const activeInvestments = myInvestments.filter((i) => i.status === "ACTIVE");
  const completedInvestments = myInvestments.filter((i) => i.status === "COMPLETED");
  const totalInvested = activeInvestments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Investment Plans</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Copy trading investment plans — market-dependent returns, not guaranteed.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Wallet Balance", value: formatCurrency(wallet?.balance ?? 0), cls: "text-white" },
          { label: "Total Invested", value: formatCurrency(totalInvested), cls: "text-[#f0b429]" },
          { label: "Active Plans", value: activeInvestments.length.toString(), cls: "text-[#22c55e]" },
          { label: "Completed Plans", value: completedInvestments.length.toString(), cls: "text-[#888]" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">{label}</div>
            <div className={`text-[20px] font-bold ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl flex gap-3">
        <AlertTriangle size={14} className="text-[#ef4444] shrink-0 mt-0.5" />
        <p className="text-[12px] text-[#888] leading-relaxed">
          <span className="text-[#ef4444] font-semibold">Risk Warning:</span> All investment plans carry market risk. Returns are market-dependent and not guaranteed. Capital invested in a plan is locked until maturity. Past performance does not guarantee future results.
        </p>
      </div>

      {/* Available plans */}
      {plans.length > 0 && (
        <section>
          <h2 className="text-[16px] font-semibold text-white mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <form
                key={plan.id}
                action={async (fd: FormData) => {
                  "use server";
                  await purchaseInvestment({
                    planId: fd.get("planId") as string,
                    amount: parseFloat(fd.get("amount") as string),
                  });
                  revalidatePath("/investments");
                  revalidatePath("/wallet");
                }}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 flex flex-col hover:border-[#2a2a2a] transition-colors"
              >
                <input type="hidden" name="planId" value={plan.id} />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[15px] font-bold text-white">{plan.name}</div>
                    <div className="text-[11px] text-[#555] mt-0.5">{plan.durationDays} days duration</div>
                  </div>
                  <div className="w-8 h-8 bg-[#f0b429]/10 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-[#f0b429]" />
                  </div>
                </div>

                <p className="text-[12px] text-[#555] leading-relaxed mb-4 flex-1">{plan.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#555] uppercase tracking-wider mb-0.5">Minimum</div>
                    <div className="text-[13px] font-bold text-white">{formatCurrency(plan.minAmount)}</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <div className="text-[9px] text-[#555] uppercase tracking-wider mb-0.5">Duration</div>
                    <div className="text-[13px] font-bold text-white">{plan.durationDays}d</div>
                  </div>
                </div>

                <input
                  name="amount"
                  type="number"
                  min={plan.minAmount}
                  step="0.01"
                  required
                  placeholder={`Amount (min ${formatCurrency(plan.minAmount)})`}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 mb-3"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors"
                >
                  Purchase Plan
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      {/* Active investments */}
      {activeInvestments.length > 0 && (
        <section>
          <h2 className="text-[16px] font-semibold text-white mb-4">Active Investments</h2>
          <div className="space-y-3">
            {activeInvestments.map((inv) => {
              const elapsed = Date.now() - new Date(inv.startDate).getTime();
              const total = new Date(inv.endDate).getTime() - new Date(inv.startDate).getTime();
              const pct = Math.min(100, Math.round((elapsed / total) * 100));
              return (
                <div key={inv.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[14px] font-semibold text-white">{inv.plan.name}</div>
                      <div className="text-[11px] text-[#555]">Started {formatDate(inv.startDate)}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold rounded uppercase">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3 text-[12px]">
                    <div>
                      <div className="text-[#555] mb-0.5">Invested</div>
                      <div className="font-semibold text-white">{formatCurrency(inv.amount)}</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-0.5">Matures</div>
                      <div className="font-semibold text-white">{formatDate(inv.endDate)}</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-0.5">Progress</div>
                      <div className="font-semibold text-[#f0b429]">{pct}%</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#f0b429] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed investments */}
      {completedInvestments.length > 0 && (
        <section>
          <h2 className="text-[16px] font-semibold text-white mb-4">Completed Investments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[480px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Plan", "Invested", "Payout Credited", "Completed", "Status"].map((h) => (
                    <th key={h} className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedInvestments.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-3 font-medium text-white">{inv.plan.name}</td>
                    <td className="py-3 text-[#aaa]">{formatCurrency(inv.amount)}</td>
                    <td className="py-3 text-[#22c55e] font-semibold">{formatCurrency(inv.expectedPayout)}</td>
                    <td className="py-3 text-[#555]">{inv.completedAt ? formatDate(inv.completedAt) : "—"}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-[#f0b429]/10 text-[#f0b429] text-[10px] font-bold rounded uppercase">COMPLETED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {plans.length === 0 && myInvestments.length === 0 && (
        <div className="text-center py-16">
          <Clock size={32} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#555] text-[14px]">No investment plans available yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
