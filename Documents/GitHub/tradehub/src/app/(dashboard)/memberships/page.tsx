import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { getPlans, getUserMemberships, cancelMembership } from "@/lib/actions/memberships";
import { getPublicSiteConfig } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import MembershipPlansClient from "./MembershipPlansClient";

const DEPOSIT_KEYS = ["deposit_usdt_trc20","deposit_usdt_erc20","deposit_usdt_bep20","deposit_eth","deposit_btc"];

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [plans, memberships, wallet, sp, cfg] = await Promise.all([
    getPlans(),
    getUserMemberships(),
    prisma.wallet.findUnique({ where: { userId: user.id } }),
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

  const activeMembership = memberships.find((m) => m.status === "ACTIVE");
  const walletBalance = wallet?.balance ?? 0;

  return (
    <div className="space-y-8">
      {sp.error && (
        <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
          {decodeURIComponent(sp.error)}
        </div>
      )}

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
            <form action={async () => {
              "use server";
              const result = await cancelMembership({ membershipId: activeMembership.id });
              if (!result.success) redirect(`/memberships?error=${encodeURIComponent(result.error)}`);
              revalidatePath("/memberships");
            }}>
              <button type="submit" className="ml-4 text-[11px] text-[#ef4444]/70 hover:text-[#ef4444] transition-colors">
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Plan cards with modal — client component */}
      <MembershipPlansClient
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          duration: p.duration,
          benefits: p.benefits,
        }))}
        activeMembershipPlanId={(activeMembership as any)?.planId}
        walletBalance={walletBalance}
        depositAddresses={depositAddresses}
      />

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
