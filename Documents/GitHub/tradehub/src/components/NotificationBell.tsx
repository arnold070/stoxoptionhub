"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, AlertTriangle, TrendingUp, Wallet } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  initialNotifications: Notification[];
}

function typeIcon(type: string) {
  if (type === "DEPOSIT_APPROVED" || type === "WALLET_CREDIT") return <CheckCircle size={13} className="text-[#22c55e] shrink-0" />;
  if (type === "DEPOSIT_REJECTED") return <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />;
  if (type === "INVESTMENT_CREATED" || type === "INVESTMENT_MATURED") return <TrendingUp size={13} className="text-[#f0b429] shrink-0" />;
  return <Wallet size={13} className="text-[#888] shrink-0" />;
}

export default function NotificationBell({ initialNotifications }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 text-[#666] hover:text-white transition-colors"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#ef4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
            <span className="text-[13px] font-semibold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-[#f0b429] hover:opacity-80">
                  Mark all read
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-[#555] hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#555] text-[13px]">No notifications yet.</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0 ${n.isRead ? "opacity-50" : ""}`}
                >
                  <div className="mt-0.5">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white mb-0.5">{n.title}</div>
                    <div className="text-[11px] text-[#555] leading-relaxed">{n.message}</div>
                  </div>
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f0b429] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
