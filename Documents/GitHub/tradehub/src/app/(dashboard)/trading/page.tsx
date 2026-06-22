import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getStrategies, getUserAllocations, allocateToStrategy, withdrawFromStrategy } from "@/lib/actions/copy-trading";
import { formatCurrency } from "@/lib/utils";
import { Clock, TrendingUp, Users, CheckCircle, ArrowUpRight, ShieldCheck } from "lucide-react";

const TIER_META: Record<string, { label: string; cls: string; border: string; glow: string }> = {
  BRONZE:   { label: "BRONZE",   cls: "text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/30",  border: "border-[#cd7f32]/25",  glow: "hover:border-[#cd7f32]/50"  },
  SILVER:   { label: "SILVER",   cls: "text-[#aaa] bg-[#aaa]/10 border-[#aaa]/30",            border: "border-[#aaa]/20",     glow: "hover:border-[#aaa]/40"     },
  GOLD:     { label: "GOLD",     cls: "text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30",  border: "border-[#f0b429]/25",  glow: "hover:border-[#f0b429]/50"  },
  PLATINUM: { label: "PLATINUM", cls: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/30",  border: "border-[#818cf8]/25",  glow: "hover:border-[#818cf8]/50"  },
};

export default async function CopyTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [strategies, myAllocations, sp] = await Promise.all([
    getStrategies(),
    getUserAllocations(),
    searchParams,
  ]);

  const myAllocationIds = new Set(myAllocations.map((a) => a.strategyId));

  return (
    <div className="space-y-8">
      {sp.error && (
        <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Copy Trading Plans</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Subscribe to institutional strategies. Returns are market-dependent and not guaranteed.
        </p>
      </div>

      {/* My active allocations */}
      {myAllocations.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider mb-3">My Active Subscriptions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAllocations.map((alloc) => {
              const meta = TIER_META[alloc.strategy.tier] ?? TIER_META.BRONZE;
              const roi   = (alloc.strategy as any).roiPercent ?? alloc.strategy.performance;
              const days  = (alloc.strategy as any).durationDays ?? 30;
              return (
                <div key={alloc.id} className={`bg-[#111] border ${meta.border} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                    <span className="text-[11px] text-[#22c55e] flex items-center gap-1"><CheckCircle size={11} /> Active</span>
                  </div>
                  <h3 className="font-bold text-white text-[15px] mb-1">{alloc.strategy.name}</h3>
                  <p className="text-[22px] font-bold text-white mb-0.5">{formatCurrency(alloc.amount)}</p>
                  <p className="text-[11px] text-[#555] mb-4">{roi}% ROI · {days}d plan</p>
                  <form action={async () => {
                    "use server";
                    const result = await withdrawFromStrategy({ allocationId: alloc.id });
                    if (!result.success) redirect(`/trading?error=${encodeURIComponent(result.error)}`);
                    revalidatePath("/trading");
                    revalidatePath("/wallet");
                  }}>
                    <button type="submit" className="w-full py-2 text-[12px] font-semibold text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                      Unsubscribe
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan cards */}
      {strategies.length === 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-12 text-center">
          <TrendingUp size={32} className="text-[#333] mx-auto mb-3" />
          <p className="text-[#555] text-[13px]">No plans available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map((strategy) => {
            const isAllocated = myAllocationIds.has(strategy.id);
            const meta        = TIER_META[strategy.tier] ?? TIER_META.BRONZE;
            const investors   = (strategy as any)._count?.allocations ?? 0;
            const roi         = (strategy as any).roiPercent ?? strategy.performance;
            const days        = (strategy as any).durationDays ?? 30;

            return (
              <div key={strategy.id}
                className={`bg-[#111] border ${isAllocated ? "border-[#f0b429]/40" : `border-[#1e1e1e] ${meta.glow}`} rounded-xl overflow-hidden transition-colors`}>

                {/* Tier stripe */}
                <div className={`h-1 w-full ${
                  strategy.tier === "GOLD" ? "bg-[#f0b429]"
                  : strategy.tier === "PLATINUM" ? "bg-[#818cf8]"
                  : strategy.tier === "SILVER" ? "bg-[#aaa]"
                  : "bg-[#cd7f32]"
                }`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls} mb-2 inline-block`}>{meta.label}</span>
                      <h3 className="font-bold text-white text-[16px] leading-tight">{strategy.name}</h3>
                      <p className="text-[11px] text-[#555] mt-0.5">{strategy.description}</p>
                    </div>
                    {isAllocated && (
                      <span className="shrink-0 ml-2 flex items-center gap-1 text-[10px] text-[#22c55e] font-semibold">
                        <CheckCircle size={11} /> Subscribed
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">% Profit</div>
                      <div className="text-[18px] font-bold text-[#22c55e]">{roi}%</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5 flex items-center gap-1"><Clock size={9} /> Duration</div>
                      <div className="text-[18px] font-bold text-white">{days}d</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Min</div>
                      <div className="text-[14px] font-bold text-white">{formatCurrency(strategy.minAmount)}</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3">
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Max</div>
                      <div className="text-[14px] font-bold text-white">{strategy.maxAmount ? formatCurrency(strategy.maxAmount) : "Unlimited"}</div>
                    </div>
                  </div>

                  {/* Investors */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#555] mb-4">
                    <Users size={11} />
                    <span>{investors} active subscriber{investors !== 1 ? "s" : ""}</span>
                    {strategy.managedBy && <><span>·</span><span>{strategy.managedBy}</span></>}
                  </div>

                  {/* CTA */}
                  {isAllocated ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-[#f0b429] text-[12px] font-semibold bg-[#f0b429]/5 rounded-lg border border-[#f0b429]/20">
                      <ArrowUpRight size={13} /> Currently subscribed
                    </div>
                  ) : (
                    <form action={async (fd: FormData) => {
                      "use server";
                      const result = await allocateToStrategy({
                        strategyId: strategy.id,
                        amount: parseFloat(fd.get("amount") as string),
                      });
                      if (!result.success) redirect(`/trading?error=${encodeURIComponent(result.error)}`);
                      revalidatePath("/trading");
                      revalidatePath("/wallet");
                    }}>
                      <div className="space-y-2">
                        <input
                          name="amount"
                          type="number"
                          min={strategy.minAmount}
                          max={strategy.maxAmount ?? undefined}
                          step="0.01"
                          defaultValue={strategy.minAmount}
                          required
                          aria-label={`Investment amount for ${strategy.name}`}
                          placeholder={`Min ${formatCurrency(strategy.minAmount)}`}
                          className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50"
                        />
                        <button type="submit" className="w-full py-2.5 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                          Subscribe Now
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-4 bg-[#111] border border-[#1e1e1e] rounded-xl">
        <ShieldCheck size={14} className="text-[#555] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#444] leading-relaxed">
          Copy trading involves market risk. Past performance and stated ROI figures do not guarantee future results. Only invest amounts you can afford to lose. All returns are market-dependent.
        </p>
      </div>

      {/* Top Strategies by Performance */}
      {strategies.filter((s) => s.performance > 0).length > 0 && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
          <h2 className="text-[15px] font-semibold text-white mb-5">Top Plans by Performance</h2>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-[13px] min-w-[400px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["#", "Plan", "Tier", "ROI %", "Duration"].map((h) => (
                    <th key={h} className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...strategies]
                  .sort((a, b) => ((b as any).roiPercent ?? b.performance) - ((a as any).roiPercent ?? a.performance))
                  .slice(0, 5)
                  .map((s, i) => {
                    const meta = TIER_META[s.tier] ?? TIER_META.BRONZE;
                    const roi  = (s as any).roiPercent ?? s.performance;
                    const days = (s as any).durationDays ?? 30;
                    return (
                      <tr key={s.id} className="border-b border-[#1a1a1a] last:border-0">
                        <td className="py-3 text-[#555] font-medium">#{String(i + 1).padStart(2, "0")}</td>
                        <td className="py-3 font-semibold text-white">{s.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${meta.cls}`}>{meta.label}</span>
                        </td>
                        <td className="py-3 font-bold text-[#22c55e]">{roi}%</td>
                        <td className="py-3 text-[#888]">{days}d</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
