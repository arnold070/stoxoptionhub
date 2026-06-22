"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  GraduationCap,
  Wallet,
  Video,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  Monitor,
  Menu,
  X,
  BarChart2,
  Users,
  Bell,
  CreditCard,
  PieChart,
  Shield,
  Globe,
  FileText,
  ArrowDownCircle,
  Headphones,
  LayoutTemplate,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/trading", icon: TrendingUp, label: "Copy Trading" },
  { href: "/investments", icon: BarChart2, label: "Investments" },
  { href: "/memberships", icon: GraduationCap, label: "Mentorship" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/community", icon: MessageSquare, label: "Community" },
  { href: "/live-sessions", icon: Video, label: "Live Sessions" },
  { href: "/content", icon: BookOpen, label: "Content Library" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const adminNavItems = [
  { href: "/admin",                 icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users",           icon: Users,           label: "Users" },
  { href: "/admin/plans",           icon: GraduationCap,   label: "Mentorship Plans" },
  { href: "/admin/strategies",      icon: TrendingUp,      label: "Copy Trading" },
  { href: "/admin/investments",     icon: BarChart2,       label: "Investment Plans" },
  { href: "/admin/deposits",        icon: Wallet,          label: "Deposits" },
  { href: "/admin/withdrawals",     icon: ArrowDownCircle, label: "Withdrawals" },
  { href: "/admin/transactions",    icon: FileText,        label: "Transactions" },
  { href: "/admin/wallet",          icon: CreditCard,      label: "Wallet Mgmt" },
  { href: "/admin/community",       icon: Globe,           label: "Communities" },
  { href: "/admin/live-sessions",   icon: Video,           label: "Live Sessions" },
  { href: "/admin/content",         icon: BookOpen,        label: "Content" },
  { href: "/admin/notifications",   icon: Bell,            label: "Notifications" },
  { href: "/admin/analytics",       icon: PieChart,        label: "Analytics" },
  { href: "/admin/audit-logs",      icon: Shield,          label: "Audit Logs" },
  { href: "/admin/live-chat",       icon: Headphones,      label: "Live Chat" },
  { href: "/admin/cms",             icon: LayoutTemplate,  label: "CMS" },
  { href: "/settings",              icon: Settings,        label: "Settings" },
];

export default function DashboardShell({
  userName,
  isAdmin,
  formattedBalance,
  signOutAction,
  notifications,
  membershipPlan,
  children,
}: {
  userName: string;
  isAdmin: boolean;
  formattedBalance: string;
  signOutAction: () => Promise<void>;
  notifications: Array<{ id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }>;
  membershipPlan: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape key closes the drawer and returns focus to the trigger.
  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Move focus into the drawer when it opens.
  useEffect(() => {
    if (menuOpen) firstLinkRef.current?.focus();
  }, [menuOpen]);

  const items = isAdmin ? adminNavItems : navItems;

  const sidebarContent = (
    <>
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {items.map(({ href, icon: Icon, label }, i) => (
          <Link
            key={href}
            ref={i === 0 ? firstLinkRef : undefined}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] hover:text-white hover:bg-[#1a1a1a] transition-colors group min-h-[44px] ${
              pathname === href ? "text-white bg-[#1a1a1a]" : "text-[#666]"
            }`}
          >
            <Icon size={14} className={`transition-colors shrink-0 ${pathname === href ? "text-[#f0b429]" : "group-hover:text-[#f0b429]"}`} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-[#1a1a1a] space-y-2">
        {!isAdmin && (
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
            {membershipPlan ? (
              <>
                <div className="text-[10px] text-[#f0b429] font-semibold uppercase tracking-wider mb-1">
                  {membershipPlan}
                </div>
                <div className="text-[10px] text-[#444] mb-2">Active membership</div>
                <Link href="/memberships">
                  <button type="button" className="w-full py-1.5 bg-transparent border border-[#333] rounded text-[11px] text-[#666] hover:text-white hover:border-[#555] transition-colors min-h-[36px]">
                    Manage Plan
                  </button>
                </Link>
              </>
            ) : (
              <>
                <div className="text-[10px] text-[#666] font-semibold uppercase tracking-wider mb-1">
                  No Active Plan
                </div>
                <div className="text-[10px] text-[#444] mb-2">Unlock mentorship &amp; signals</div>
                <Link href="/memberships">
                  <button type="button" className="w-full py-1.5 bg-transparent border border-[#f0b429] rounded text-[11px] text-[#f0b429] font-semibold hover:bg-[#f0b429]/10 transition-colors min-h-[36px]">
                    View Plans
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-[13px] text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors group min-h-[44px]"
          >
            <LogOut size={14} className="group-hover:text-[#f0b429] transition-colors shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Top navbar */}
      <header className="flex items-center justify-between px-3 sm:px-6 h-14 border-b border-[#1e1e1e] bg-[#0a0a0a] shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-3 sm:gap-8 min-w-0">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen ? "true" : "false"}
            aria-controls="mobile-sidebar"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-md text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors shrink-0"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo href="/dashboard" size={30} textTheme="light" />
          <nav className="hidden md:flex gap-6">
            {["Market", "Indices", "Options"].map((item) => (
              <span key={item} className="text-[13px] text-[#888] cursor-pointer hover:text-white transition-colors">
                {item}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-semibold text-[#22c55e]">${formattedBalance} USD</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest">Available Margin</div>
          </div>
          <Link href="/wallet">
            <button type="button" className="px-2.5 sm:px-3.5 py-1.5 bg-[#f0b429] hover:bg-[#e0a424] rounded-md text-[11px] sm:text-[12px] font-semibold text-black transition-colors min-h-[36px] whitespace-nowrap">
              <span className="hidden sm:inline">Quick Deposit</span>
              <span className="sm:hidden">Deposit</span>
            </button>
          </Link>
          <div className="hidden sm:block">
            <NotificationBell initialNotifications={notifications} />
          </div>
          <Monitor size={17} className="hidden sm:block text-[#666] cursor-pointer hover:text-white transition-colors" aria-label="Display settings" />
          <div className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[12px] font-semibold text-white cursor-pointer shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile drawer backdrop */}
        {menuOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="md:hidden fixed inset-0 top-14 bg-black/60 z-20"
          />
        )}

        {/* Sidebar: static on desktop, slide-in drawer on mobile */}
        <aside
          id="mobile-sidebar"
          className={`fixed md:static top-14 md:top-0 left-0 h-[calc(100%-3.5rem)] md:h-auto w-[240px] md:w-[200px] bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col shrink-0 z-30 transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="px-4 py-5 border-b border-[#1a1a1a] hidden md:block">
            <div>
              <Logo href="/dashboard" size={28} textTheme="light" />
              <div className="text-[9px] text-[#444] uppercase tracking-widest mt-1.5 ml-0.5">Institutional Grade</div>
            </div>
          </div>
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] w-full min-w-0">
          <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
