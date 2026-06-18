import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getRecentNotifications, broadcastNotification } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import { Bell, Send } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT_SUBMITTED: "bg-[#818cf8]/10 text-[#818cf8]",
  DEPOSIT_APPROVED:  "bg-[#22c55e]/10 text-[#22c55e]",
  DEPOSIT_REJECTED:  "bg-[#ef4444]/10 text-[#ef4444]",
  INVESTMENT_CREATED:"bg-[#f0b429]/10 text-[#f0b429]",
  INVESTMENT_MATURED:"bg-[#22c55e]/10 text-[#22c55e]",
  WALLET_CREDIT:     "bg-[#22c55e]/10 text-[#22c55e]",
  GENERAL:           "bg-[#555]/20 text-[#888]",
};

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const notifications = await getRecentNotifications({ limit: 30 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-[13px] text-[#555] mt-1">Broadcast messages to all users or targeted groups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast form */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1e1e1e]">
            <Send size={14} className="text-[#f0b429]" />
            <h2 className="font-semibold text-white text-[14px]">Broadcast Notification</h2>
          </div>
          <form action={async (fd: FormData) => {
            "use server";
            await broadcastNotification(
              fd.get("title") as string,
              fd.get("message") as string
            );
          }} className="space-y-3">
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Title *</label>
              <input name="title" required placeholder="Notification title" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#666] uppercase tracking-wider block mb-1">Message *</label>
              <textarea name="message" required rows={4} placeholder="Write your message to users..." className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/50 resize-none" />
            </div>
            <p className="text-[10px] text-[#444]">This will send to ALL registered users. For targeted delivery, use the API.</p>
            <button type="submit" className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] rounded-lg text-[13px] font-bold text-black transition-colors flex items-center justify-center gap-2">
              <Send size={14} /> Send to All Users
            </button>
          </form>
        </div>

        {/* Recent notifications */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
              <Bell size={14} className="text-[#818cf8]" />
              <h2 className="font-semibold text-white text-[14px]">Recent Notifications</h2>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {notifications.length === 0 && (
                <div className="p-8 text-center">
                  <Bell size={24} className="text-[#333] mx-auto mb-2" />
                  <p className="text-[#555] text-[13px]">No notifications yet</p>
                </div>
              )}
              {notifications.map((n) => {
                const u = (n as any).user;
                return (
                  <div key={n.id} className="p-4 hover:bg-[#141414]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${TYPE_COLORS[n.type] ?? "bg-[#555]/20 text-[#888]"}`}>{n.type.replace(/_/g, " ")}</span>
                        <p className="font-medium text-white text-[13px] truncate">{n.title}</p>
                      </div>
                      <span className="text-[10px] text-[#444] shrink-0">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-[12px] text-[#666] ml-0 mb-1">{n.message}</p>
                    {u && <p className="text-[10px] text-[#444]">→ {u.name} ({u.email})</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
