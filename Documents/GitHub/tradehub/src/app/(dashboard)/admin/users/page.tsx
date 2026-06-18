import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getFilteredUsers,
  suspendUser,
  unsuspendUser,
  adminBanUser,
  adminUnbanUser,
  adminRestoreUser,
} from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, UserCheck, UserX, UserPlus, Search } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All",       value: "all" },
  { label: "Active",    value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Banned",    value: "banned" },
  { label: "Deleted",   value: "deleted" },
];

const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Roles",  value: "" },
  { label: "Visitor",    value: "VISITOR" },
  { label: "Member",     value: "MEMBER" },
  { label: "Mentor",     value: "MENTOR" },
  { label: "Trader",     value: "TRADER" },
  { label: "Admin",      value: "ADMIN" },
];

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  return `/admin/users?${params}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "all";
  const role = sp.role ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 25;

  const base = { q: q || undefined, status: status !== "all" ? status : undefined, role: role || undefined };

  const { users, total } = await getFilteredUsers({ search: q, status, role, page, limit });
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-[13px] text-[#555] mt-1">{total} user{total !== 1 ? "s" : ""} found</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#f0b429] text-black text-[12px] font-bold rounded-lg hover:bg-[#e0a820] transition-colors shrink-0"
        >
          <UserPlus size={13} /> New User
        </Link>
      </div>

      {/* Search bar */}
      <form method="GET" action="/admin/users" className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#444] outline-none focus:border-[#f0b429]/40"
            />
          </div>
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          {role && <input type="hidden" name="role" value={role} />}
          <button
            type="submit"
            className="px-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-[12px] text-[#aaa] hover:text-white transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href={buildHref(base, { q: undefined, page: undefined })}
              className="px-3 py-2 text-[12px] text-[#555] hover:text-[#ef4444] transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const href = buildHref({ ...base, page: undefined }, { status: tab.value !== "all" ? tab.value : undefined });
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-[#f0b429]/15 text-[#f0b429] border border-[#f0b429]/30"
                  : "text-[#555] hover:text-[#888] border border-transparent"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}

        <div className="ml-auto shrink-0">
          <form method="GET" action="/admin/users">
            {q && <input type="hidden" name="q" value={q} />}
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <select
              name="role"
              defaultValue={role}
              onChange={undefined}
              className="text-[12px] bg-[#111] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-[#888] outline-none"
              aria-label="Filter by role"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button type="submit" className="ml-2 text-[11px] text-[#f0b429] font-bold hover:opacity-80">Filter</button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[860px]">
            <thead>
              <tr className="border-b border-[#1e1e1e] text-left">
                {["User", "Role", "Status", "Balance", "Plan", "Joined", "Actions"].map((h) => (
                  <th key={h} className="p-4 font-medium text-[#555] uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#555] text-[13px]">
                    <Users size={28} className="text-[#2a2a2a] mx-auto mb-3" />
                    No users match the current filters
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uc = u as typeof u & {
                    isBanned?: boolean;
                    deletedAt?: Date | null;
                    wallet?: { balance: number } | null;
                    memberships?: Array<{ plan: { name: string } }>;
                  };
                  const balance = uc.wallet?.balance ?? 0;
                  const activePlan = uc.memberships?.[0]?.plan?.name;
                  const isDeleted = !!uc.deletedAt;
                  const isBanned = !!uc.isBanned;
                  const isSuspended = u.isSuspended && !isBanned && !isDeleted;

                  let statusLabel = "Active";
                  let statusClass = "bg-[#22c55e]/10 text-[#22c55e]";
                  if (isDeleted) { statusLabel = "Deleted"; statusClass = "bg-[#888]/10 text-[#888]"; }
                  else if (isBanned) { statusLabel = "Banned"; statusClass = "bg-[#ef4444]/10 text-[#ef4444]"; }
                  else if (isSuspended) { statusLabel = "Suspended"; statusClass = "bg-[#f97316]/10 text-[#f97316]"; }

                  return (
                    <tr key={u.id} className={`border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414] ${isDeleted ? "opacity-50" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate max-w-[160px]">{u.name}</p>
                            <p className="text-[11px] text-[#555] truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          u.role === "ADMIN" ? "bg-[#818cf8]/10 text-[#818cf8]" :
                          u.role === "MEMBER" ? "bg-[#f0b429]/10 text-[#f0b429]" :
                          "bg-[#555]/10 text-[#888]"
                        }`}>{u.role.toLowerCase()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">{formatCurrency(balance)}</td>
                      <td className="p-4 text-[#888]">{activePlan ?? <span className="text-[#333]">—</span>}</td>
                      <td className="p-4 text-[#555]">{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="text-[11px] text-[#f0b429] hover:opacity-80 font-medium"
                          >
                            Manage
                          </Link>
                          {!isDeleted && !isBanned && (
                            u.isSuspended ? (
                              <form action={async () => { "use server"; await unsuspendUser(u.id); }}>
                                <button type="submit" className="flex items-center gap-1 text-[11px] text-[#22c55e] hover:opacity-80 font-medium">
                                  <UserCheck size={11} /> Unsuspend
                                </button>
                              </form>
                            ) : (
                              <form action={async () => { "use server"; await suspendUser(u.id); }}>
                                <button type="submit" className="flex items-center gap-1 text-[11px] text-[#ef4444] hover:opacity-80 font-medium">
                                  <UserX size={11} /> Suspend
                                </button>
                              </form>
                            )
                          )}
                          {isBanned && (
                            <form action={async () => { "use server"; await adminUnbanUser(u.id); }}>
                              <button type="submit" className="text-[11px] text-[#22c55e] hover:opacity-80 font-medium">
                                Unban
                              </button>
                            </form>
                          )}
                          {isDeleted && (
                            <form action={async () => { "use server"; await adminRestoreUser(u.id); }}>
                              <button type="submit" className="text-[11px] text-[#22c55e] hover:opacity-80 font-medium">
                                Restore
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] text-[#555]">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref(base, { page: String(page - 1) })}
                className="px-3 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref(base, { page: String(page + 1) })}
                className="px-3 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
