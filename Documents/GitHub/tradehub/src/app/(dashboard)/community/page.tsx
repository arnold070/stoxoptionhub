import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getCommunityLinks } from "@/lib/actions/community";
import { prisma } from "@/lib/prisma";
import { ExternalLink, Users, Calendar } from "lucide-react";

const TYPE_META: Record<string, { icon: string; cls: string; label: string }> = {
  TELEGRAM: { icon: "▷", cls: "text-[#229ed9]", label: "Telegram" },
  DISCORD:  { icon: "◈", cls: "text-[#5865f2]", label: "Discord" },
  WHATSAPP: { icon: "◉", cls: "text-[#25d366]", label: "WhatsApp" },
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [links, upcomingSessions, strategies] = await Promise.all([
    getCommunityLinks(),
    prisma.liveSession.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
    prisma.strategy.findMany({
      where: { isActive: true },
      orderBy: { performance: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Global Community</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Connect with institutional-grade analysts and traders in our exclusive secure ecosystem.
        </p>
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
          <div className="col-span-full bg-[#111] border border-[#1e1e1e] rounded-xl p-8 text-center">
            <p className="text-[13px] text-[#555]">Community channels will appear here once configured by the team.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Active Strategies */}
        <div>
          <h2 className="text-[15px] font-semibold text-white mb-4">Active Strategies</h2>
          {strategies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {strategies.map((s) => (
                <div key={s.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center hover:border-[#f0b429]/30 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] mx-auto mb-2 flex items-center justify-center">
                    <Users size={20} className="text-[#333]" />
                  </div>
                  <div className="text-[12px] font-semibold text-white mb-1">{s.name}</div>
                  <div className="text-[10px] text-[#555] uppercase tracking-wider">{s.tier.toLowerCase()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-8 text-center">
              <p className="text-[13px] text-[#555]">No active strategies available yet.</p>
            </div>
          )}
        </div>

        {/* Upcoming Live Sessions */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-[#f0b429]" />
            <h2 className="text-[15px] font-semibold text-white">Upcoming Sessions</h2>
          </div>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const date = new Date(session.scheduledAt);
                const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
                const day = date.getDate().toString();
                return (
                  <div key={session.id} className="flex gap-3">
                    <div className="w-10 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center py-2 shrink-0 border border-[#2a2a2a]">
                      <div className="text-[9px] text-[#555] uppercase">{month}</div>
                      <div className="text-[16px] font-bold text-white">{day}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-white">{session.title}</span>
                        {session.membersOnly && <span className="text-[#555] text-[11px]">🔒</span>}
                      </div>
                      <div className="text-[11px] text-[#555] mt-0.5">
                        {date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-[#555]">No upcoming sessions scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}
