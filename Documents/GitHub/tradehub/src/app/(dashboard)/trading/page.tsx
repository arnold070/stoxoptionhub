import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getStrategies, getUserAllocations, allocateToStrategy, withdrawFromStrategy } from "@/lib/actions/copy-trading";
import { formatCurrency } from "@/lib/utils";
import { Search, SlidersHorizontal, Star, ArrowUpRight } from "lucide-react";

const TIER_META: Record<string, { label: string; cls: string; border: string }> = {
  BRONZE: { label: "BRONZE", cls: "text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/30", border: "border-[#cd7f32]/20" },
  SILVER: { label: "SILVER", cls: "text-[#aaa] bg-[#aaa]/10 border-[#aaa]/30", border: "border-[#aaa]/20" },
  GOLD:   { label: "GOLD",   cls: "text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30", border: "border-[#f0b429]/20" },
  PLATINUM: { label: "PLATINUM", cls: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/30", border: "border-[#818cf8]/20" },
};

const TIER_MIN: Record<string, string> = {
  BRONZE: "$500+", SILVER: "$5,000+", GOLD: "$25,000+", PLATINUM: "$100,000+",
};
const TIER_DESC: Record<string, string> = {
  BRONZE: "Fundamental strategies and insights.",
  SILVER: "Priority execution and mid-frequency signals.",
  GOLD: "Institutional risk management and dedicated access.",
  PLATINUM: "Full alpha, quant-grade execution.",
};

export default async function CopyTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [strategies, myAllocations, sp] = await Promise.all([getStrategies(), getUserAllocations(), searchParams]);
  const myAllocationIds = new Set(myAllocations.map((a) => a.strategyId));

  const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;

  const topPerformers = [
    { rank: "#01", name: "Liquid_Snake", type: "Cross-Asset Arbitrage", roi: "+42.15%" },
    { rank: "#02", name: "Vault_Tech",   type: "Indices Futures",        roi: "+38.90%" },
    { rank: "#03", name: "Zenith_Quant", type: "Stablecoin Delta Neutral", roi: "+31.22%" },
  ];

  return (
    <div className="space-y-8">
      {sp.error && (
        <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy Marketplace</h1>
          <p className="text-[13px] text-[#555] mt-1">Copy institutional-grade strategies with real-time execution.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-2 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2">
            <Search size={14} className="text-[#555] shrink-0" />
            <input
              className="bg-transparent text-[13px] text-white placeholder:text-[#555] outline-none w-full sm:w-44"
              placeholder="Search strategies..."
              readOnly
            />
          </div>
          <button type="button" className="flex items-center gap-2 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[13px] text-[#888] hover:text-white transition-colors shrink-0">
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* My active allocations */}
      {myAllocations.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider mb-3">My Active Allocations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAllocations.map((alloc) => {
              const meta = TIER_META[alloc.strategy.tier] ?? TIER_META.BRONZE;
              return (
                <div key={alloc.id} className={`bg-[#111] border ${meta.border} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-[14px]">{alloc.strategy.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <p className="text-[22px] font-bold text-white mb-1">{formatCurrency(alloc.amount)}</p>
                  <p className="text-[11px] text-[#22c55e] mb-4">+{alloc.strategy.performance}% ROI (30D)</p>
                  <form action={async () => {
                    "use server";
                    const result = await withdrawFromStrategy({ allocationId: alloc.id });
                    if (!result.success) redirect(`/trading?error=${encodeURIComponent(result.error)}`);
                    revalidatePath("/trading");
                    revalidatePath("/wallet");
                  }}>
                    <button type="submit" className="w-full py-2 text-[12px] font-semibold text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                      Withdraw
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <div key={tier} className={`bg-[#111] border ${meta.border} rounded-xl p-5`}>
              <div className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${meta.cls.split(" ")[0]}`}>
                {tier}
              </div>
              <div className="text-[26px] font-bold text-white mb-1">{TIER_MIN[tier]}</div>
              <p className="text-[12px] text-[#555]">{TIER_DESC[tier]}</p>
            </div>
          );
        })}
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {strategies.map((strategy) => {
          const isAllocated = myAllocationIds.has(strategy.id);
          const meta = TIER_META[strategy.tier] ?? TIER_META.BRONZE;
          const investors = (strategy as any)._count?.allocations ?? 0;
          return (
            <div key={strategy.id} className={`bg-[#111] border ${isAllocated ? "border-[#f0b429]/40" : "border-[#1e1e1e]"} rounded-xl p-5`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[12px] font-bold text-[#f0b429]">
                    {strategy.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-[14px]">{strategy.name}</h3>
                    <p className="text-[11px] text-[#555]">by StoxOptionHub Team</p>
                  </div>
                </div>
                <div className={`text-[22px] font-bold ${strategy.performance >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {strategy.performance >= 0 ? "+" : ""}{strategy.performance}%
                </div>
              </div>

              <div className="text-[10px] text-[#555] mb-0.5 uppercase tracking-wider">ROI (30D)</div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={11} className={s <= 4 ? "text-[#f0b429] fill-[#f0b429]" : "text-[#333]"} />)}
                </div>
                <span className="text-[11px] text-[#555]">4.8 Rating</span>
                <span className="text-[11px] text-[#555]">·</span>
                <span className="text-[11px] text-[#555]">${(strategy.minAmount * investors + strategy.minAmount * 3).toLocaleString()} AUM</span>
              </div>

              <div className="h-12 bg-[#1a1a1a] rounded-lg mb-4 overflow-hidden">
                <svg viewBox="0 0 200 48" className="w-full h-full">
                  <polyline
                    points="0,40 25,30 50,35 75,20 100,25 125,15 150,18 175,10 200,8"
                    fill="none"
                    stroke={strategy.performance >= 0 ? "#22c55e" : "#ef4444"}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                <span className="text-[11px] text-[#555]">{investors} investors</span>
                <span className="text-[11px] text-[#555]">· Min {formatCurrency(strategy.minAmount)}</span>
              </div>

              {isAllocated ? (
                <div className="flex items-center justify-center gap-1.5 py-2 text-[#f0b429] text-[12px] font-medium">
                  <ArrowUpRight size={13} /> Currently allocated
                </div>
              ) : (
                <form action={async (fd: FormData) => {
                  "use server";
                  const result = await allocateToStrategy({ strategyId: strategy.id, amount: parseFloat(fd.get("amount") as string) });
                  if (!result.success) redirect(`/trading?error=${encodeURIComponent(result.error)}`);
                  revalidatePath("/trading");
                  revalidatePath("/wallet");
                }}>
                  <div className="flex gap-2">
                    <input
                      name="amount"
                      type="number"
                      min={strategy.minAmount}
                      step="0.01"
                      placeholder={`Min ${formatCurrency(strategy.minAmount)}`}
                      required
                      className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
                      Join
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Performers */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-white">Top Performers (This Month)</h2>
          <button type="button" className="text-[12px] text-[#f0b429] hover:opacity-80 flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline">View All Traders</span> <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-[13px] min-w-[480px]">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              {["Rank", "Trader", "Strategy Type", "30D ROI", "Actions"].map((h) => (
                <th key={h} className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topPerformers.map(({ rank, name, type, roi }) => (
              <tr key={rank} className="border-b border-[#1a1a1a] last:border-0">
                <td className="py-3 text-[#555] font-medium">{rank}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]" />
                    <span className="font-semibold text-white">{name}</span>
                  </div>
                </td>
                <td className="py-3 text-[#888]">{type}</td>
                <td className="py-3 font-semibold text-[#22c55e]">{roi}</td>
                <td className="py-3">
                  <button type="button" className="text-[#f0b429] text-[12px] font-medium hover:opacity-80">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
