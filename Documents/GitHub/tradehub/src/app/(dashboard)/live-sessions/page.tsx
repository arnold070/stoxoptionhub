import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getLiveSessions } from "@/lib/actions/sessions";
import { formatDate } from "@/lib/utils";
import { Video, Radio, Calendar, Lock } from "lucide-react";

export default async function LiveSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await getLiveSessions();
  const live = sessions.filter((s) => s.isLive);
  const upcoming = sessions.filter((s) => !s.isLive && !s.endedAt && new Date(s.scheduledAt) > new Date());
  const past = sessions.filter((s) => !!s.endedAt);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
        <p className="text-[13px] text-[#555] mt-1">
          Join live trading sessions and watch replays
        </p>
      </div>

      {/* Live now */}
      {live.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-[#ef4444] flex items-center gap-2 mb-4">
            <Radio size={18} className="animate-pulse" /> Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map((s) => (
              <div key={s.id} className="relative bg-[#111] rounded-xl p-5 border-2 border-[#ef4444]/50">
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-ping" />
                  Live
                </span>
                <h3 className="font-bold text-white pr-16 mb-2">{s.title}</h3>
                {s.description && (
                  <p className="text-[12px] text-[#888] mb-4">{s.description}</p>
                )}
                {s.streamUrl && (
                  <a
                    href={s.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors"
                  >
                    <Video size={14} /> Join Stream
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-[#f0b429]" /> Upcoming Sessions
          </h2>
          <div className="space-y-3">
            {upcoming.map((s) => (
              <div key={s.id} className="bg-[#111] rounded-xl p-5 border border-[#1e1e1e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    {s.membersOnly && <Lock size={13} className="text-[#f0b429] shrink-0" />}
                  </div>
                  {s.description && (
                    <p className="text-[12px] text-[#888] mt-0.5">{s.description}</p>
                  )}
                </div>
                <div className="sm:text-right shrink-0 sm:ml-4">
                  <p className="text-[13px] font-medium text-[#f0b429]">
                    {formatDate(s.scheduledAt)}
                  </p>
                  <p className="text-[11px] text-[#555]">
                    {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past / Replays */}
      {past.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2 mb-4">
            <Video size={18} className="text-[#f0b429]" /> Session Replays
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((s) => (
              <div key={s.id} className="bg-[#111] rounded-xl p-5 border border-[#1e1e1e]">
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-[11px] text-[#444] mb-3">
                  {s.endedAt ? formatDate(s.endedAt) : ""}
                </p>
                {s.replayUrl ? (
                  <a
                    href={s.replayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-medium text-[#f0b429] hover:opacity-80"
                  >
                    <Video size={14} /> Watch Replay
                  </a>
                ) : (
                  <p className="text-[12px] text-[#444]">Replay coming soon</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-16 text-[#555]">
          <Video size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-[13px]">No sessions scheduled yet.</p>
        </div>
      )}
    </div>
  );
}
