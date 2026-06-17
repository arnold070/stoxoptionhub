import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCommunityLinks } from "@/lib/actions/community";
import { ExternalLink, Users } from "lucide-react";

const TYPE_META: Record<string, { icon: string; cls: string; label: string }> = {
  TELEGRAM: { icon: "▷", cls: "text-[#229ed9]", label: "Telegram" },
  DISCORD:  { icon: "◈", cls: "text-[#5865f2]", label: "Discord" },
  WHATSAPP: { icon: "◉", cls: "text-[#25d366]", label: "WhatsApp" },
};

const ANNOUNCEMENTS = [
  {
    tag: "MARKET UPDATE", time: "2 hours ago",
    title: "Institutional inflow suggests potential weekend rally in Index Options",
    body: "Proprietary flow indicators show significant whale activity accumulating near support zones…",
    img: true,
  },
  {
    tag: "COMMUNITY EVENT", time: "5 hours ago",
    title: "Community Town Hall: Q4 Roadmap Reveal with CEO",
    body: "Join us live on Discord for an exclusive breakdown of the new automated copy-trading…",
    img: true,
  },
];

const EVENTS = [
  { month: "SEP", day: "24", title: "Weekly Alpha Webinar", sub: "18:00 UTC · Discord Stream", locked: false },
  { month: "SEP", day: "28", title: "Private Round Table", sub: "Elite Members Only", locked: true },
  { month: "OCT", day: "02", title: "Macro Outlook Session", sub: "14:00 UTC · Main Stage", locked: false },
];

const MENTORS = [
  { name: "CryptoNova",   pnl: "+42.5%" },
  { name: "FX_Strategist", pnl: "+18.2%" },
  { name: "BullMarket",   pnl: "+24.0%" },
  { name: "MacroVibe",    pnl: "+11.4%" },
  { name: "LiquidAlpha",  pnl: "+37.8%" },
  { name: "Z-Trader",     pnl: "+21.2%" },
];

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const links = await getCommunityLinks();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Community</h1>
          <p className="text-[13px] text-[#555] mt-1">
            Connect with institutional-grade analysts and high-net-worth traders in our exclusive secure ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1e1e1e] rounded-full self-start sm:self-auto shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[12px] font-semibold text-white">1,240 ONLINE</span>
        </div>
      </div>

      {/* Community channel cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {links.length > 0 ? links.map((link) => {
          const meta = TYPE_META[link.type] ?? { icon: "◎", cls: "text-[#888]", label: link.type };
          return (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
              className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 hover:border-[#f0b429]/30 transition-colors group">
              <div className={`text-3xl mb-4 ${meta.cls}`}>{meta.icon}</div>
              <h3 className="text-[16px] font-bold text-white mb-2">{link.name}</h3>
              <p className="text-[12px] text-[#555] mb-5 leading-relaxed">
                {link.type === "TELEGRAM"
                  ? "Real-time institutional trade alerts and market volatility pings."
                  : "Technical analysis, macro trends, and networking sub-channels."}
              </p>
              <div className="flex items-center gap-1.5 text-[#f0b429] text-[12px] font-semibold">
                {link.type === "TELEGRAM" ? "Enter Channel" : "Join Server"} <ExternalLink size={11} />
              </div>
            </a>
          );
        }) : (
          /* Fallback static cards */
          [
            { name: "Telegram Signals", type: "TELEGRAM", desc: "Real-time institutional trade alerts and market volatility pings.", action: "Enter Channel" },
            { name: "Alpha HQ Discord", type: "DISCORD",  desc: "Technical analysis, macro trends, and networking sub-channels.", action: "Join Server" },
            { name: "Whale Direct",     type: "WHALE",    desc: "Direct pipeline to the trade desks of high-volume fund managers.", action: "Upgrade Status", locked: true },
          ].map(({ name, type, desc, action, locked }) => {
            const meta = TYPE_META[type] ?? { icon: "◎", cls: "text-[#888]", label: type };
            return (
              <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 relative">
                {locked && (
                  <div className="absolute top-4 right-4 text-[#444] text-[16px]">🔒</div>
                )}
                <div className={`text-3xl mb-4 ${locked ? "text-[#444]" : meta.cls}`}>{meta.icon}</div>
                <h3 className={`text-[16px] font-bold mb-2 ${locked ? "text-[#555]" : "text-white"}`}>{name}</h3>
                <p className="text-[12px] text-[#555] mb-5 leading-relaxed">{desc}</p>
                <div className={`text-[12px] font-semibold ${locked ? "text-[#444]" : "text-[#f0b429]"}`}>{action}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Latest Announcements</h2>
            <button type="button" className="text-[12px] text-[#f0b429] flex items-center gap-1 hover:opacity-80">
              View All ↗
            </button>
          </div>
          {ANNOUNCEMENTS.map(({ tag, time, title, body }) => (
            <div key={title} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-5 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-[9px] font-bold text-[#f0b429] uppercase tracking-widest">{tag}</span>
                  <span className="text-[11px] text-[#555]">{time}</span>
                </div>
                <h3 className="text-[14px] font-bold text-white mb-1.5">{title}</h3>
                <p className="text-[12px] text-[#555] leading-relaxed">{body}</p>
              </div>
              <div className="hidden sm:flex w-20 h-16 bg-[#1a1a1a] rounded-lg shrink-0 items-center justify-center text-[#333] text-2xl">
                📈
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {EVENTS.map(({ month, day, title, sub, locked }) => (
              <div key={title} className="flex gap-3">
                <div className="w-10 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center py-2 shrink-0 border border-[#2a2a2a]">
                  <div className="text-[9px] text-[#555] uppercase">{month}</div>
                  <div className="text-[16px] font-bold text-white">{day}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-white">{title}</span>
                    {locked && <span className="text-[#555] text-[11px]">🔒</span>}
                  </div>
                  <div className="text-[11px] text-[#555] mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="mt-5 w-full text-[11px] text-[#555] flex items-center justify-center gap-1.5 hover:text-white transition-colors">
            🗓 SYNC CALENDAR
          </button>
        </div>
      </div>

      {/* Top Mentors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Top Mentors</h2>
          <span className="text-[10px] text-[#555] uppercase tracking-widest">Active This Month</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {MENTORS.map(({ name, pnl }) => (
            <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center hover:border-[#f0b429]/30 transition-colors cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] mx-auto mb-2 flex items-center justify-center">
                <Users size={20} className="text-[#333]" />
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] mx-auto -mt-1.5 mb-2 border border-[#0a0a0a]" />
              <div className="text-[12px] font-semibold text-white mb-1">{name}</div>
              <div className="text-[11px] font-bold text-[#22c55e]">{pnl} PnL</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
