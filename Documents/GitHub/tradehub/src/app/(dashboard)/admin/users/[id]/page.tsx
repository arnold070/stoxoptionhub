import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getUserDetail,
  updateUserProfile,
  adminBanUser,
  adminUnbanUser,
  adminSoftDeleteUser,
  adminRestoreUser,
  adminSetNote,
  adminResetPassword,
  adminCreditWallet,
  adminDebitWallet,
  suspendUser,
  unsuspendUser,
  updateUserRole,
} from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Users,
  CreditCard,
  ShieldCheck,
  ShieldX,
  Trash2,
  RotateCcw,
  KeyRound,
  StickyNote,
  UserX,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

function StatusBadge({ u }: { u: { isSuspended: boolean; isBanned?: boolean; deletedAt?: Date | null } }) {
  const isDeleted = !!u.deletedAt;
  const isBanned = !!u.isBanned;
  if (isDeleted) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#888]/10 text-[#888]">Deleted</span>;
  if (isBanned) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#ef4444]/10 text-[#ef4444]">Banned</span>;
  if (u.isSuspended) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#f97316]/10 text-[#f97316]">Suspended</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#22c55e]/10 text-[#22c55e]">Active</span>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e1e]">
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, name, defaultValue, type = "text", placeholder }: {
  label: string; name: string; defaultValue?: string | null; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#f0b429]/40 transition-colors"
      />
    </div>
  );
}

function SaveBtn({ label = "Save Changes" }: { label?: string }) {
  return (
    <button type="submit" className="px-4 py-2 bg-[#f0b429] text-black text-[12px] font-bold rounded-lg hover:bg-[#e0a820] transition-colors">
      {label}
    </button>
  );
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/dashboard");

  const { id: userId } = await params;
  const sp = await searchParams;

  const u = await getUserDetail(userId);
  if (!u) redirect("/admin/users");

  const uc = u as typeof u & { isBanned?: boolean; deletedAt?: Date | null; adminNote?: string | null };
  const balance = u.wallet?.balance ?? 0;
  const isDeleted = !!uc.deletedAt;
  const isBanned = !!uc.isBanned;

  const txTypeColor: Record<string, string> = {
    DEPOSIT: "text-[#22c55e]", WITHDRAWAL: "text-[#f97316]",
    ADJUSTMENT: "text-[#818cf8]", PAYOUT: "text-[#f0b429]",
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#555] hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">User Profile</h1>
          <p className="text-[12px] text-[#555] mt-0.5">ID: {u.id}</p>
        </div>
      </div>

      {sp.msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-[13px] font-medium ${
          sp.msg.startsWith("err") ? "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20" : "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20"
        }`}>
          {sp.msg === "profile_ok" && "Profile updated successfully."}
          {sp.msg === "note_ok" && "Admin note saved."}
          {sp.msg === "pw_ok" && "Password reset successfully."}
          {sp.msg === "wallet_ok" && "Wallet updated successfully."}
          {sp.msg === "status_ok" && "Account status updated."}
          {sp.msg.startsWith("err_") && `Error: ${sp.msg.slice(4).replace(/_/g, " ")}`}
        </div>
      )}

      {/* Identity card */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{u.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                u.role === "ADMIN" ? "bg-[#818cf8]/10 text-[#818cf8]" : "bg-[#f0b429]/10 text-[#f0b429]"
              }`}>{u.role.toLowerCase()}</span>
              <StatusBadge u={uc} />
            </div>
            <p className="text-[13px] text-[#888] mt-0.5">{u.email}</p>
            {u.phone && <p className="text-[12px] text-[#555] mt-0.5">{u.phone}</p>}
            <p className="text-[11px] text-[#444] mt-1.5">Joined {formatDate(u.createdAt)}</p>
          </div>
          {uc.adminNote && (
            <div className="max-w-xs bg-[#1a1500] border border-[#f0b429]/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#f0b429] uppercase tracking-wider mb-1">Admin Note</p>
              <p className="text-[12px] text-[#ccc]">{uc.adminNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Wallet Balance",  value: formatCurrency(balance),    icon: Wallet,    color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
          { label: "Transactions",    value: u._count.transactions,       icon: CreditCard, color: "text-[#818cf8]", bg: "bg-[#818cf8]/10" },
          { label: "Investments",     value: u._count.investments,        icon: TrendingUp, color: "text-[#f0b429]", bg: "bg-[#f0b429]/10" },
          { label: "Memberships",     value: u._count.memberships,        icon: Users,      color: "text-[#888]",    bg: "bg-[#888]/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#555] uppercase tracking-wider">{label}</span>
              <span className={`p-1.5 rounded-lg ${bg}`}><Icon size={13} className={color} /></span>
            </div>
            <p className="text-[20px] font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile edit */}
          <Card title="Edit Profile">
            <form
              action={async (fd: FormData) => {
                "use server";
                const res = await updateUserProfile(userId, {
                  name: fd.get("name") as string,
                  email: fd.get("email") as string,
                  phone: (fd.get("phone") as string) || null,
                });
                redirect(`/admin/users/${userId}?msg=${res.success ? "profile_ok" : "err_" + res.error.replace(/ /g, "_")}`);
              }}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Full Name" name="name" defaultValue={u.name} placeholder="Full name" />
                <FormField label="Email" name="email" type="email" defaultValue={u.email} placeholder="email@example.com" />
              </div>
              <FormField label="Phone" name="phone" defaultValue={u.phone} placeholder="+1 (555) 000-0000" />
              <SaveBtn />
            </form>
          </Card>

          {/* Recent transactions */}
          {u.transactions.length > 0 && (
            <Card title="Recent Transactions">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[#1e1e1e] text-left">
                      {["Type", "Amount", "Status", "Date"].map((h) => (
                        <th key={h} className="pb-3 font-medium text-[#555] uppercase text-[10px] tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {u.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0">
                        <td className="py-2.5">
                          <span className={`font-medium ${txTypeColor[tx.type] ?? "text-[#888]"}`}>{tx.type.replace(/_/g, " ")}</span>
                        </td>
                        <td className="py-2.5 text-white font-medium">{formatCurrency(tx.amount)}</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            tx.status === "APPROVED" || tx.status === "COMPLETED" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                            tx.status === "PENDING" ? "bg-[#f0b429]/10 text-[#f0b429]" :
                            "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}>{tx.status.toLowerCase()}</span>
                        </td>
                        <td className="py-2.5 text-[#555]">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Memberships */}
          {u.memberships.length > 0 && (
            <Card title="Memberships">
              <div className="space-y-2">
                {u.memberships.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                    <div>
                      <p className="text-[13px] text-white font-medium">{m.plan.name}</p>
                      {m.startDate && (
                        <p className="text-[11px] text-[#555]">{formatDate(m.startDate)} – {m.endDate ? formatDate(m.endDate) : "∞"}</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      m.status === "ACTIVE" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                      m.status === "EXPIRED" ? "bg-[#555]/10 text-[#888]" :
                      "bg-[#ef4444]/10 text-[#ef4444]"
                    }`}>{m.status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account status */}
          <Card title="Account Status">
            <div className="space-y-3">
              {/* Role */}
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await updateUserRole(userId, fd.get("role") as Role);
                  redirect(`/admin/users/${userId}?msg=status_ok`);
                }}
                className="flex items-center gap-2"
              >
                <label className="text-[11px] text-[#555] uppercase tracking-wider w-24 shrink-0">Role</label>
                <select
                  name="role"
                  defaultValue={u.role}
                  className="flex-1 text-[12px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-white outline-none"
                >
                  {(["VISITOR", "MEMBER", "MENTOR", "TRADER", "ADMIN"] as Role[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#1e1e1e] text-[#f0b429] font-bold rounded-lg hover:bg-[#2a2a2a] transition-colors">Set</button>
              </form>

              <hr className="border-[#1a1a1a]" />

              {/* Suspend / Unsuspend */}
              {!isDeleted && !isBanned && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {u.isSuspended ? <UserCheck size={14} className="text-[#22c55e]" /> : <UserX size={14} className="text-[#f97316]" />}
                    <span className="text-[12px] text-[#aaa]">{u.isSuspended ? "User is suspended" : "Suspend account"}</span>
                  </div>
                  {u.isSuspended ? (
                    <form action={async () => { "use server"; await unsuspendUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                      <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#22c55e]/10 text-[#22c55e] font-bold rounded-lg hover:bg-[#22c55e]/20">Unsuspend</button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await suspendUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                      <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#f97316]/10 text-[#f97316] font-bold rounded-lg hover:bg-[#f97316]/20">Suspend</button>
                    </form>
                  )}
                </div>
              )}

              {/* Ban / Unban */}
              {!isDeleted && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isBanned ? <ShieldCheck size={14} className="text-[#22c55e]" /> : <ShieldX size={14} className="text-[#ef4444]" />}
                    <span className="text-[12px] text-[#aaa]">{isBanned ? "User is banned" : "Ban account"}</span>
                  </div>
                  {isBanned ? (
                    <form action={async () => { "use server"; await adminUnbanUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                      <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#22c55e]/10 text-[#22c55e] font-bold rounded-lg hover:bg-[#22c55e]/20">Unban</button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await adminBanUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                      <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#ef4444]/10 text-[#ef4444] font-bold rounded-lg hover:bg-[#ef4444]/20">Ban</button>
                    </form>
                  )}
                </div>
              )}

              {/* Delete / Restore */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDeleted ? <RotateCcw size={14} className="text-[#22c55e]" /> : <Trash2 size={14} className="text-[#888]" />}
                  <span className="text-[12px] text-[#aaa]">{isDeleted ? "Account deleted" : "Soft delete"}</span>
                </div>
                {isDeleted ? (
                  <form action={async () => { "use server"; await adminRestoreUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                    <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#22c55e]/10 text-[#22c55e] font-bold rounded-lg hover:bg-[#22c55e]/20">Restore</button>
                  </form>
                ) : (
                  <form action={async () => { "use server"; await adminSoftDeleteUser(userId); redirect(`/admin/users/${userId}?msg=status_ok`); }}>
                    <button type="submit" className="px-3 py-1.5 text-[11px] bg-[#888]/10 text-[#888] font-bold rounded-lg hover:bg-[#888]/20">Delete</button>
                  </form>
                )}
              </div>
            </div>
          </Card>

          {/* Wallet management */}
          <Card title="Wallet Management">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] text-[#555]">Current balance</span>
              <span className="text-[18px] font-bold text-white">{formatCurrency(balance)}</span>
            </div>
            <div className="space-y-4">
              <form
                action={async (fd: FormData) => {
                  "use server";
                  const amt = parseFloat(fd.get("amount") as string);
                  if (!amt || amt <= 0) redirect(`/admin/users/${userId}?msg=err_invalid_amount`);
                  await adminCreditWallet(userId, amt, (fd.get("reason") as string) || "Admin credit");
                  redirect(`/admin/users/${userId}?msg=wallet_ok`);
                }}
                className="space-y-2"
              >
                <p className="text-[11px] text-[#22c55e] font-bold uppercase tracking-wider">Credit Wallet</p>
                <div className="flex gap-2">
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#22c55e]/40"
                  />
                  <SaveBtn label="Credit" />
                </div>
                <input
                  name="reason"
                  type="text"
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder-[#333] outline-none focus:border-[#22c55e]/40"
                />
              </form>

              <form
                action={async (fd: FormData) => {
                  "use server";
                  const amt = parseFloat(fd.get("amount") as string);
                  if (!amt || amt <= 0) redirect(`/admin/users/${userId}?msg=err_invalid_amount`);
                  await adminDebitWallet(userId, amt, (fd.get("reason") as string) || "Admin debit");
                  redirect(`/admin/users/${userId}?msg=wallet_ok`);
                }}
                className="space-y-2"
              >
                <p className="text-[11px] text-[#ef4444] font-bold uppercase tracking-wider">Debit Wallet</p>
                <div className="flex gap-2">
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Amount"
                    className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#ef4444]/40"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] text-[12px] font-bold rounded-lg hover:bg-[#ef4444]/20 transition-colors">
                    Debit
                  </button>
                </div>
                <input
                  name="reason"
                  type="text"
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder-[#333] outline-none focus:border-[#ef4444]/40"
                />
              </form>
            </div>
          </Card>

          {/* Admin note */}
          <Card title="Admin Note">
            <form
              action={async (fd: FormData) => {
                "use server";
                await adminSetNote(userId, (fd.get("note") as string) ?? "");
                redirect(`/admin/users/${userId}?msg=note_ok`);
              }}
              className="space-y-3"
            >
              <div className="flex items-start gap-2">
                <StickyNote size={13} className="text-[#f0b429] mt-0.5 shrink-0" />
                <textarea
                  name="note"
                  rows={3}
                  defaultValue={uc.adminNote ?? ""}
                  placeholder="Internal note about this user (not visible to the user)…"
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#f0b429]/40 resize-none"
                />
              </div>
              <SaveBtn label="Save Note" />
            </form>
          </Card>

          {/* Password reset */}
          <Card title="Reset Password">
            <form
              action={async (fd: FormData) => {
                "use server";
                const pw = fd.get("password") as string;
                const res = await adminResetPassword(userId, pw);
                redirect(`/admin/users/${userId}?msg=${res.success ? "pw_ok" : "err_" + res.error.replace(/ /g, "_")}`);
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <KeyRound size={13} className="text-[#818cf8] shrink-0" />
                <input
                  name="password"
                  type="text"
                  placeholder="New password (min 8 characters)"
                  autoComplete="off"
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder-[#333] outline-none focus:border-[#818cf8]/40"
                />
              </div>
              <SaveBtn label="Reset Password" />
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
