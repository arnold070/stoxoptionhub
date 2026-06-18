import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getLiveSessions, createLiveSession, updateLiveSession, deleteLiveSession } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Video, Plus, Trash2, Radio, Square } from "lucide-react";

export default async function AdminLiveSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sessions = await getLiveSessions({ limit: 30 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
        <p className="text-[13px] text-[#555] mt-1">Schedule, manage and broadcast live trading sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Plus size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Schedule Session</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            await createLiveSession({
              title: fd.get("title") as string,
              description: fd.get("description") as string || undefined,
              scheduledAt: new Date(fd.get("scheduledAt") as string),
              streamUrl: fd.get("streamUrl") as string || undefined,
              membersOnly: fd.get("membersOnly") === "on",
            });
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Session Title *</label>
              <input name="title" required placeholder="e.g. Weekly Market Analysis" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Scheduled Date & Time *</label>
              <input name="scheduledAt" type="datetime-local" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Stream URL</label>
              <input name="streamUrl" type="url" placeholder="https://youtube.com/live/..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Description</label>
              <textarea name="description" rows={3} placeholder="What will be covered in this session" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="membersOnly" defaultChecked className="accent-[#f0b429]" />
              <span className="text-[12px] text-[#888]">Members only</span>
            </label>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors">
              Schedule Session
            </button>
          </form>
        </div>

        {/* Sessions list */}
        <div className="lg:col-span-2 space-y-3">
          {sessions.length === 0 && (
            <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
              <Video size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#555] text-[13px]">No sessions scheduled yet</p>
            </div>
          )}
          {sessions.map((s) => {
            const isPast = new Date(s.scheduledAt) < new Date();
            return (
              <div key={s.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {s.isLive && <span className="text-[9px] bg-[#ef4444] text-white px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">LIVE</span>}
                      {s.endedAt && <span className="text-[9px] bg-[#555]/20 text-[#888] px-1.5 py-0.5 rounded font-bold uppercase">Ended</span>}
                      {!s.isLive && !s.endedAt && !isPast && <span className="text-[9px] bg-[#22c55e]/10 text-[#22c55e] px-1.5 py-0.5 rounded font-bold uppercase">Upcoming</span>}
                      {!s.isLive && !s.endedAt && isPast && <span className="text-[9px] bg-[#f0b429]/10 text-[#f0b429] px-1.5 py-0.5 rounded font-bold uppercase">Past</span>}
                      {s.membersOnly && <span className="text-[9px] bg-[#818cf8]/10 text-[#818cf8] px-1.5 py-0.5 rounded font-bold uppercase">Members</span>}
                    </div>
                    <h3 className="font-semibold text-white text-[14px] mb-0.5">{s.title}</h3>
                    {s.description && <p className="text-[11px] text-[#666] mb-1">{s.description}</p>}
                    <p className="text-[10px] text-[#555]">Scheduled: {new Date(s.scheduledAt).toLocaleString()}</p>
                    {s.streamUrl && <p className="text-[10px] text-[#444] truncate mt-0.5">Stream: {s.streamUrl}</p>}
                    {s.replayUrl && <p className="text-[10px] text-[#444] truncate mt-0.5">Replay: {s.replayUrl}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!s.isLive && !s.endedAt && (
                      <form action={async () => { "use server"; await updateLiveSession(s.id, { isLive: true }); }}>
                        <button type="submit" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors">
                          <Radio size={11} /> Go Live
                        </button>
                      </form>
                    )}
                    {s.isLive && (
                      <form action={async () => { "use server"; await updateLiveSession(s.id, { isLive: false, endedAt: new Date() }); }}>
                        <button type="submit" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#555]/20 text-[#888] hover:bg-[#555]/30 transition-colors">
                          <Square size={11} /> End Session
                        </button>
                      </form>
                    )}
                    <form action={async () => { "use server"; await deleteLiveSession(s.id); }}>
                      <button type="submit" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a1a1a] text-[#555] hover:text-[#ef4444] transition-colors">
                        <Trash2 size={11} /> Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
