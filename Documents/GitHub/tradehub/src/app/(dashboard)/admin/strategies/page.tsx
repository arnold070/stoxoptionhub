import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getStrategies, createStrategy, updateStrategy, deleteStrategy } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { StrategyTier } from "@/generated/prisma/enums";

const TIER_COLORS: Record<StrategyTier, string> = {
  BRONZE:   "bg-[#cd7f32]/10 text-[#cd7f32]",
  SILVER:   "bg-[#c0c0c0]/10 text-[#c0c0c0]",
  GOLD:     "bg-[#f0b429]/10 text-[#f0b429]",
  PLATINUM: "bg-[#818cf8]/10 text-[#818cf8]",
};

export default async function AdminStrategiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const strategies = await getStrategies();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Copy Trading Strategies</h1>
        <p className="text-[13px] text-[#555] mt-1">Manage strategies users can allocate funds to. Performance figures are market-dependent.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">New Strategy</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            await createStrategy({
              name: fd.get("name") as string,
              description: fd.get("description") as string,
              tier: fd.get("tier") as StrategyTier,
              minAmount: Number(fd.get("minAmount")),
              maxAmount: fd.get("maxAmount") ? Number(fd.get("maxAmount")) : undefined,
              performance: fd.get("performance") ? Number(fd.get("performance")) : 0,
              managedBy: fd.get("managedBy") as string || undefined,
            });
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Strategy Name *</label>
              <input name="name" required placeholder="e.g. Momentum Pro" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Description *</label>
              <textarea name="description" required rows={2} placeholder="Strategy approach and market focus" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Tier *</label>
              <select name="tier" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-[#f0b429]/50">
                <option value="">Select tier</option>
                {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as StrategyTier[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Min Amount *</label>
                <input name="minAmount" type="number" min="0" step="0.01" required placeholder="100" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
              </div>
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Max Amount</label>
                <input name="maxAmount" type="number" min="0" step="0.01" placeholder="Unlimited" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Historical Performance (%)</label>
              <input name="performance" type="number" step="0.01" placeholder="0.00" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Managed By</label>
              <input name="managedBy" placeholder="Trader name / team" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <p className="text-[10px] text-[#444] leading-relaxed">Past performance does not guarantee future results. All investing involves risk.</p>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors">
              Create Strategy
            </button>
          </form>
        </div>

        {/* Strategies list */}
        <div className="lg:col-span-2 space-y-3">
          {strategies.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <TrendingUp size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No strategies yet</p>
            </div>
          )}
          {strategies.map((s) => (
            <div key={s.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-[15px]">{s.name}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${TIER_COLORS[s.tier]}`}>{s.tier}</span>
                    {!s.isActive && <span className="text-[9px] bg-[#ef4444]/10 text-[#ef4444] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>}
                  </div>
                  <p className="text-[12px] text-[#666]">{s.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[16px] font-bold text-[#22c55e]">{s.performance}%</p>
                  <p className="text-[10px] text-[#555]">historical</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-[#555] mb-4">
                <span>Min: {formatCurrency(s.minAmount)}</span>
                <span>Max: {s.maxAmount ? formatCurrency(s.maxAmount) : "Unlimited"}</span>
                <span>{(s as any)._count?.allocations ?? 0} allocations</span>
                {s.managedBy && <span>By: {s.managedBy}</span>}
                <span>Created {formatDate(s.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await updateStrategy(s.id, { isActive: !s.isActive }); }}>
                  <button type="submit" className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    s.isActive
                      ? "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
                      : "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                  }`}>
                    {s.isActive ? <><XCircle size={12} /> Disable</> : <><CheckCircle size={12} /> Enable</>}
                  </button>
                </form>
                <form action={async () => { "use server"; await deleteStrategy(s.id); }}>
                  <button type="submit" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#666] hover:text-[#ef4444] transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
