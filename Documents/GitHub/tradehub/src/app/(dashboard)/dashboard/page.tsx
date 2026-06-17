import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

function MiniChart() {
  const points = [30, 45, 35, 55, 48, 65, 58, 72, 68, 85, 78, 92];
  const w = 260;
  const h = 80;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 10) - 5}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 sm:h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0b429" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f0b429" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="#f0b429" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, activeMembership, allocations, recentTransactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.membership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.allocation.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { strategy: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
  const balance = wallet?.balance ?? 0;

  const topStats = [
    { label: "Total Portfolio", value: formatCurrency(balance + totalAllocated), sub: "+12.4%", subCls: "text-[#22c55e]", valueCls: "text-white" },
    { label: "Available", value: formatCurrency(balance), sub: `${allocations.length} active pairs`, subCls: "text-[#888]", valueCls: "text-white" },
    { label: "Status", value: activeMembership?.plan.name ?? "Free", sub: "Active Plan", subCls: "text-[#888]", valueCls: "text-[#f0b429]" },
    { label: "30D Profit", value: formatCurrency(totalAllocated * 0.14), sub: "Net Earnings", subCls: "text-[#888]", valueCls: "text-[#22c55e]" },
    { label: "Main Strategy", value: allocations[0]?.strategy.name ?? "—", sub: allocations[0]?.strategy.tier.toLowerCase() ?? "none", subCls: "text-[#888]", valueCls: "text-white" },
  ];

  const marketData = [
    { pair: "S&P 500", price: "5,432.1", change: "+0.45%", up: true },
    { pair: "BTC / USD", price: "68,490", change: "-1.2%", up: false },
    { pair: "GOLD (XAU)", price: "2,342", change: "+0.1%", up: true },
    { pair: "US 10Y", price: "4.24%", change: "FLAT", up: null },
  ];

  return (
    <div className="space-y-6">
      {/* Top stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStats.map(({ label, value, sub, subCls, valueCls }) => (
          <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">{label}</div>
            <div className={`text-[20px] sm:text-[22px] font-bold ${valueCls} truncate`}>{value}</div>
            <div className={`text-[11px] mt-1 ${subCls}`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Portfolio Performance */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Portfolio Performance</h2>
            <p className="text-[12px] text-[#555] mt-0.5">Growth analysis for the current fiscal period</p>
          </div>
          <div className="flex gap-2">
            {["Daily", "Weekly", "Monthly"].map((p, i) => (
              <button key={p} type="button" className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                i === 0 ? "bg-[#f0b429]/20 text-[#f0b429] border border-[#f0b429]/30" : "text-[#555] hover:text-white"
              }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full">
          <MiniChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Allocations */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-white">Strategy Allocations</h2>
            <button type="button" className="text-[12px] text-[#f0b429] flex items-center gap-1 hover:opacity-80 shrink-0">
              <span className="hidden sm:inline">View Full Report</span> <ArrowUpRight size={12} />
            </button>
          </div>
          {allocations.length === 0 ? (
            <p className="text-[#555] text-[13px]">No active allocations yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-[13px] min-w-[420px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Strategy</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Allocated</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">ROI (30D)</th>
                  <th className="text-left pb-3 text-[#555] font-medium uppercase text-[10px] tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-3 font-medium text-white">{alloc.strategy.name}</td>
                    <td className="py-3 text-[#aaa]">{formatCurrency(alloc.amount)}</td>
                    <td className="py-3 text-[#22c55e] font-semibold">+{alloc.strategy.performance}%</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-semibold rounded uppercase tracking-wider">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Right column: Recent Activity + Market Outlook */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentTransactions.slice(0, 3).map((tx) => {
                const isIn = tx.type === "DEPOSIT" || tx.type === "ALLOCATION_IN";
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isIn ? "bg-[#22c55e]/10" : "bg-[#ef4444]/10"}`}>
                        {isIn
                          ? <ArrowUpRight size={13} className="text-[#22c55e]" />
                          : <ArrowDownRight size={13} className="text-[#ef4444]" />
                        }
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-white capitalize">
                          {tx.description ?? tx.type.toLowerCase().replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-[#555]">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    <span className={`text-[13px] font-semibold ${isIn ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {isIn ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
              {recentTransactions.length === 0 && (
                <p className="text-[#555] text-[13px]">No transactions yet.</p>
              )}
            </div>
          </div>

          {/* Market Outlook */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Market Outlook</h2>
            <div className="grid grid-cols-2 gap-3">
              {marketData.map(({ pair, price, change, up }) => (
                <div key={pair} className="bg-[#1a1a1a] rounded-lg p-3">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{pair}</div>
                  <div className="text-[15px] font-bold text-white">{price}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${up === true ? "text-[#22c55e]" : up === false ? "text-[#ef4444]" : "text-[#555]"}`}>
                    <TrendingUp size={10} className="inline mr-1" />
                    {change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
