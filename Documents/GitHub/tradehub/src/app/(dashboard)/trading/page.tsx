import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getStrategies, getUserAllocations, withdrawFromStrategy } from "@/lib/actions/copy-trading";
import { getPublicSiteConfig } from "@/lib/actions/admin";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, ShieldCheck } from "lucide-react";
import TradingPlansClient from "./TradingPlansClient";

const DEPOSIT_KEYS = ["deposit_usdt_trc20","deposit_usdt_erc20","deposit_usdt_bep20","deposit_eth","deposit_btc"];

export default async function CopyTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [strategies, myAllocations, sp, cfg] = await Promise.all([
    getStrategies(),
    getUserAllocations(),
    searchParams,
    getPublicSiteConfig(DEPOSIT_KEYS),
  ]);

  const depositAddresses = {
    TRC20: cfg.deposit_usdt_trc20 ?? "",
    ERC20: cfg.deposit_usdt_erc20 ?? "",
    BEP20: cfg.deposit_usdt_bep20 ?? "",
    ETH:   cfg.deposit_eth ?? "",
    BTC:   cfg.deposit_btc ?? "",
  };

  const myAllocationIds = myAllocations.map((a) => a.strategyId);

  const serializedStrategies = strategies.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tier: s.tier as string,
    minAmount: s.minAmount,
    maxAmount: s.maxAmount ?? null,
    roiPercent: (s as any).roiPercent ?? s.performance,
    durationDays: (s as any).durationDays ?? 30,
    managedBy: s.managedBy ?? null,
    subscriberCount: (s as any)._count?.allocations ?? 0,
  }));

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
          Subscribe to institutional strategies. A valid trading code from admin is required to activate a plan.
        </p>
      </div>

      {/* My active allocations */}
      {myAllocations.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider mb-3">My Active Subscriptions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAllocations.map((alloc) => {
              const roi   = (alloc.strategy as any).roiPercent ?? alloc.strategy.performance;
              const days  = (alloc.strategy as any).durationDays ?? 30;
              return (
                <div key={alloc.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30">
                      {alloc.strategy.tier}
                    </span>
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

      {/* Plan cards — client component handles subscribe modal */}
      {strategies.length === 0 ? (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-12 text-center">
          <p className="text-[#555] text-[13px]">No plans available yet. Check back soon.</p>
        </div>
      ) : (
        <TradingPlansClient
          strategies={serializedStrategies}
          myAllocationIds={myAllocationIds}
          depositAddresses={depositAddresses}
        />
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-4 bg-[#111] border border-[#1e1e1e] rounded-xl">
        <ShieldCheck size={14} className="text-[#555] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#444] leading-relaxed">
          Copy trading involves market risk. Past performance and stated ROI figures do not guarantee future results. Only invest amounts you can afford to lose. All returns are market-dependent.
        </p>
      </div>

      {/* Top Plans leaderboard */}
      {strategies.filter((s) => s.performance > 0 || (s as any).roiPercent > 0).length > 0 && (
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
                {[...serializedStrategies]
                  .sort((a, b) => b.roiPercent - a.roiPercent)
                  .slice(0, 5)
                  .map((s, i) => (
                    <tr key={s.id} className="border-b border-[#1a1a1a] last:border-0">
                      <td className="py-3 text-[#555] font-medium">#{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3 font-semibold text-white">{s.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded border text-[10px] font-semibold text-[#f0b429] bg-[#f0b429]/10 border-[#f0b429]/30">{s.tier}</span>
                      </td>
                      <td className="py-3 font-bold text-[#22c55e]">{s.roiPercent}%</td>
                      <td className="py-3 text-[#888]">{s.durationDays}d</td>
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
