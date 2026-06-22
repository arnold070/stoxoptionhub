import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getTraders, createTrader, toggleTrader, deleteTrader } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Plus, UserCheck, UserX, Trash2, Copy, Hash } from "lucide-react";

export default async function AdminTradersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const traders = await getTraders();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Traders</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Create traders and distribute their hash codes to users who subscribe to copy trading plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">New Trader</h2>
          </div>
          <form
            action={async (fd: FormData) => {
              "use server";
              await createTrader({
                name:        fd.get("name") as string,
                description: (fd.get("description") as string) || undefined,
                hashCode:    (fd.get("hashCode") as string) || undefined,
              });
              revalidatePath("/admin/traders");
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Trader Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Marcus Webb"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Bio / Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Specialization, background, etc."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">
                Custom Hash Code <span className="text-[#444] normal-case">(leave blank to auto-generate)</span>
              </label>
              <input
                name="hashCode"
                placeholder="e.g. TRD-ABCD1234"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 font-mono"
              />
            </div>
            <p className="text-[10px] text-[#444]">
              Share the hash code privately with the user who should be assigned to this trader.
            </p>
            <button
              type="submit"
              className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors"
            >
              Create Trader
            </button>
          </form>
        </div>

        {/* Traders list */}
        <div className="lg:col-span-2 space-y-3">
          {traders.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <Hash size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No traders yet — create one using the form.</p>
            </div>
          )}

          {traders.map((t) => (
            <div key={t.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-white text-[15px] truncate">{t.name}</h3>
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      t.isActive ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                    }`}>
                      {t.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-[12px] text-[#555] truncate">{t.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] text-[#555]">{(t as any)._count?.allocations ?? 0} subscriber{(t as any)._count?.allocations !== 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-[#444]">{formatDate(t.createdAt)}</p>
                </div>
              </div>

              {/* Hash code display */}
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 mb-4">
                <Hash size={12} className="text-[#f0b429] shrink-0" />
                <code className="text-[13px] font-mono text-[#f0b429] flex-1 select-all">{t.hashCode}</code>
                <span className="text-[10px] text-[#444]">hash code</span>
              </div>

              <div className="flex gap-2">
                <form action={async () => {
                  "use server";
                  await toggleTrader(t.id);
                  revalidatePath("/admin/traders");
                }}>
                  <button
                    type="submit"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      t.isActive
                        ? "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
                        : "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                    }`}
                  >
                    {t.isActive ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
                  </button>
                </form>
                <form action={async () => {
                  "use server";
                  await deleteTrader(t.id);
                  revalidatePath("/admin/traders");
                }}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#666] hover:text-[#ef4444] transition-colors"
                  >
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
