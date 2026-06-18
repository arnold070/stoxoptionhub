import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GraduationCap, Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

export default async function AdminPlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const plans = await getPlans();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mentorship Plans</h1>
        <p className="text-[13px] text-[#555] mt-1">Create and manage subscription plans for members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create plan form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Create Plan</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            const duration = fd.get("duration") ? Number(fd.get("duration")) : undefined;
            const maxMembers = fd.get("maxMembers") ? Number(fd.get("maxMembers")) : undefined;
            await createPlan({
              name: fd.get("name") as string,
              price: Number(fd.get("price")),
              duration,
              description: fd.get("description") as string,
              benefits: fd.get("benefits") as string,
              maxMembers,
              sortOrder: fd.get("sortOrder") ? Number(fd.get("sortOrder")) : 0,
            });
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Plan Name *</label>
              <input name="name" required placeholder="e.g. Gold Mentor" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Price (USD/mo) *</label>
              <input name="price" type="number" min="0" step="0.01" required placeholder="99.00" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Duration (days, blank = unlimited)</label>
              <input name="duration" type="number" min="1" placeholder="30" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Description *</label>
              <textarea name="description" required rows={2} placeholder="Brief description of the plan" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Benefits (comma-separated) *</label>
              <textarea name="benefits" required rows={2} placeholder="Daily signals, 1-on-1 coaching, ..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Max Members</label>
                <input name="maxMembers" type="number" min="1" placeholder="Unlimited" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
              </div>
              <div>
                <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Sort Order</label>
                <input name="sortOrder" type="number" defaultValue="0" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors mt-1">
              Create Plan
            </button>
          </form>
        </div>

        {/* Plans list */}
        <div className="lg:col-span-2 space-y-3">
          {plans.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <GraduationCap size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No plans yet — create the first one</p>
            </div>
          )}
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-[15px]">{plan.name}</h3>
                    {plan.isActive
                      ? <span className="text-[9px] bg-[#22c55e]/10 text-[#22c55e] px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                      : <span className="text-[9px] bg-[#ef4444]/10 text-[#ef4444] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                    }
                  </div>
                  <p className="text-[12px] text-[#666]">{plan.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[18px] font-bold text-[#f0b429]">{formatCurrency(plan.price)}<span className="text-[11px] text-[#555]">/mo</span></p>
                  <p className="text-[10px] text-[#555]">{(plan as any)._count?.memberships ?? 0} members</p>
                </div>
              </div>
              <p className="text-[11px] text-[#555] mb-4">
                {plan.duration ? `${plan.duration} days` : "Lifetime"} · {plan.maxMembers ? `Max ${plan.maxMembers}` : "Unlimited seats"} · Order {plan.sortOrder}
              </p>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await updatePlan(plan.id, { isActive: !plan.isActive }); }}>
                  <button type="submit" className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    plan.isActive
                      ? "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
                      : "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                  }`}>
                    {plan.isActive ? <><XCircle size={12} /> Deactivate</> : <><CheckCircle size={12} /> Activate</>}
                  </button>
                </form>
                <form action={async () => { "use server"; await deletePlan(plan.id); }}>
                  <button type="submit" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#666] hover:text-[#ef4444] transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </form>
                <span className="ml-auto text-[10px] text-[#444]">Created {formatDate(plan.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
