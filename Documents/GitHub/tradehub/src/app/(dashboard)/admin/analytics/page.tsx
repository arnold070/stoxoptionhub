import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAnalyticsData } from "@/lib/actions/admin";
import { formatCurrency } from "@/lib/utils";
import { PieChart, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";

function GrowthBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${up ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
      {up ? "+" : ""}{pct}%
    </span>
  );
}

function Bar({ value, max, label, color = "bg-[#f0b429]" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#888]">{label}</span>
        <span className="text-white font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const data = await getAnalyticsData();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555]">
        Unable to load analytics data
      </div>
    );
  }

  const maxRoleCount = Math.max(...Object.values(data.roleCounts), 1);
  const maxPlanCount = Math.max(...data.topPlans.map((p) => p.count), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-[13px] text-[#555] mt-1">Last 30 days performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "New Users (30d)",
            value: data.recentUsers,
            prev: data.prevUsers,
            pct: data.userGrowthPct,
            icon: Users,
            color: "text-[#818cf8]",
            bg: "bg-[#818cf8]/10",
          },
          {
            label: "Revenue (30d)",
            value: formatCurrency(data.recentRevenue),
            prev: formatCurrency(data.prevRevenue),
            pct: data.revenueGrowthPct,
            icon: DollarSign,
            color: "text-[#22c55e]",
            bg: "bg-[#22c55e]/10",
          },
          {
            label: "Deposits (30d)",
            value: data.depositCount,
            prev: null,
            pct: null,
            icon: TrendingUp,
            color: "text-[#f0b429]",
            bg: "bg-[#f0b429]/10",
          },
          {
            label: "Withdrawals (30d)",
            value: data.withdrawalCount,
            prev: null,
            pct: null,
            icon: TrendingDown,
            color: "text-[#ef4444]",
            bg: "bg-[#ef4444]/10",
          },
        ].map(({ label, value, pct, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#888] uppercase tracking-wider">{label}</span>
              <span className={`p-1.5 rounded-lg ${bg}`}><Icon size={14} className={color} /></span>
            </div>
            <p className="text-[22px] font-bold text-white">{value}</p>
            {pct !== null && (
              <div className="mt-1">
                <GrowthBadge pct={pct} />
                <span className="text-[10px] text-[#444] ml-1">vs prev 30d</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial summary */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <h2 className="font-semibold text-white text-[14px] mb-4">Financial Flows (30d)</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#888]">Total Revenue (deposits)</span>
                <span className="text-[#22c55e] font-bold">{formatCurrency(data.recentRevenue)}</span>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#888]">Withdrawals paid out</span>
                <span className="text-[#ef4444] font-bold">{formatCurrency(data.recentWithdrawalTotal)}</span>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ef4444] rounded-full"
                  style={{ width: data.recentRevenue > 0 ? `${Math.min(100, (data.recentWithdrawalTotal / data.recentRevenue) * 100)}%` : "0%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-[#888]">New investments placed</span>
                <span className="text-[#818cf8] font-bold">{formatCurrency(data.recentInvestmentTotal)}</span>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#818cf8] rounded-full"
                  style={{ width: data.recentRevenue > 0 ? `${Math.min(100, (data.recentInvestmentTotal / data.recentRevenue) * 100)}%` : "0%" }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-[#1e1e1e]">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#888]">Net (revenue − withdrawals)</span>
                <span className={`font-bold ${data.recentRevenue - data.recentWithdrawalTotal >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {formatCurrency(data.recentRevenue - data.recentWithdrawalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User breakdown */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <h2 className="font-semibold text-white text-[14px] mb-4">Users by Role</h2>
          <div className="space-y-3">
            {Object.entries(data.roleCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([role, count]) => (
                <Bar
                  key={role}
                  label={role}
                  value={count}
                  max={maxRoleCount}
                  color={role === "ADMIN" ? "bg-[#818cf8]" : role === "MEMBER" ? "bg-[#22c55e]" : role === "MENTOR" ? "bg-[#f0b429]" : role === "TRADER" ? "bg-[#2AABEE]" : "bg-[#555]"}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Top plans */}
      {data.topPlans.length > 0 && (
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Top Membership Plans</h2>
          </div>
          <div className="space-y-3">
            {data.topPlans.map((p) => (
              <Bar
                key={p.name}
                label={p.name}
                value={p.count}
                max={maxPlanCount}
                color="bg-[#f0b429]"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
