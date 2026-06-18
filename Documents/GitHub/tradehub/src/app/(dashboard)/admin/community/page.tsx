import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCommunities, createCommunity, updateCommunity, deleteCommunity } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Globe, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { CommunityType, StrategyTier } from "@/generated/prisma/enums";

const TYPE_COLORS: Record<CommunityType, string> = {
  TELEGRAM: "bg-[#2AABEE]/10 text-[#2AABEE]",
  DISCORD:  "bg-[#5865F2]/10 text-[#5865F2]",
};

export default async function AdminCommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const communities = await getCommunities();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Community Management</h1>
        <p className="text-[13px] text-[#555] mt-1">Manage Telegram and Discord community links for members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Add Community</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            await createCommunity({
              name: fd.get("name") as string,
              type: fd.get("type") as CommunityType,
              url: fd.get("url") as string,
              tier: fd.get("tier") ? fd.get("tier") as StrategyTier : undefined,
            });
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Community Name *</label>
              <input name="name" required placeholder="e.g. Gold Signals Group" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Platform *</label>
              <select name="type" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-[#f0b429]/50">
                <option value="">Select platform</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="DISCORD">Discord</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Invite URL *</label>
              <input name="url" type="url" required placeholder="https://t.me/..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Required Tier (optional)</label>
              <select name="tier" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-[#f0b429]/50">
                <option value="">All members</option>
                {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as StrategyTier[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors">
              Add Community
            </button>
          </form>
        </div>

        {/* Communities list */}
        <div className="lg:col-span-2 space-y-3">
          {communities.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <Globe size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No communities configured yet</p>
            </div>
          )}
          {communities.map((c) => (
            <div key={c.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${TYPE_COLORS[c.type]}`}>{c.type}</span>
                    {c.tier && <span className="text-[9px] bg-[#f0b429]/10 text-[#f0b429] px-1.5 py-0.5 rounded font-bold uppercase">{c.tier}</span>}
                    {!c.isActive && <span className="text-[9px] bg-[#ef4444]/10 text-[#ef4444] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>}
                    <h3 className="font-semibold text-white text-[13px]">{c.name}</h3>
                  </div>
                  <p className="text-[11px] text-[#444] truncate">{c.url}</p>
                  <p className="text-[10px] text-[#444] mt-0.5">
                    {(c as any).plan ? `Plan: ${(c as any).plan.name}` : "All members"} · Added {formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <form action={async () => { "use server"; await updateCommunity(c.id, { isActive: !c.isActive }); }}>
                    <button type="submit" className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      c.isActive
                        ? "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
                        : "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                    }`}>
                      {c.isActive ? <><XCircle size={11} /> Disable</> : <><CheckCircle size={11} /> Enable</>}
                    </button>
                  </form>
                  <form action={async () => { "use server"; await deleteCommunity(c.id); }}>
                    <button type="submit" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#555] hover:text-[#ef4444] transition-colors">
                      <Trash2 size={11} /> Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
