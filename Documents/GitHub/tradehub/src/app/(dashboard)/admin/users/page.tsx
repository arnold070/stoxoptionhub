import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getUsers, suspendUser, unsuspendUser, updateUserRole } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, UserCheck, UserX } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await getUsers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-[13px] text-[#555] mt-1">{users.length} registered accounts</p>
      </div>

      <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
        <div className="p-5 border-b border-[#1e1e1e] flex items-center gap-2">
          <Users size={15} className="text-[#818cf8]" />
          <h2 className="font-semibold text-white text-[14px]">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#1e1e1e] text-left">
                {["Name", "Email", "Role", "Plan", "Balance", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-4 font-medium text-[#555] uppercase text-[10px] tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const activePlan = (u as any).memberships?.[0]?.plan?.name as string | undefined;
                const balance = (u as any).wallet?.balance ?? 0;
                return (
                  <tr key={u.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414]">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#888]">{u.email}</td>
                    <td className="p-4">
                      <form action={async (fd: FormData) => {
                        "use server";
                        await updateUserRole(u.id, fd.get("role") as Role);
                      }} className="flex items-center gap-1">
                        <select
                          name="role"
                          defaultValue={u.role}
                          aria-label="User role"
                          className="text-[11px] rounded border border-[#2a2a2a] bg-[#1a1a1a] text-white px-1.5 py-0.5 outline-none"
                        >
                          {(["VISITOR", "MEMBER", "MENTOR", "TRADER", "ADMIN"] as Role[]).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-[10px] text-[#f0b429] hover:opacity-80 font-bold">Set</button>
                      </form>
                    </td>
                    <td className="p-4 text-[#888]">{activePlan ?? <span className="text-[#444]">None</span>}</td>
                    <td className="p-4 text-white font-medium">{formatCurrency(balance)}</td>
                    <td className="p-4 text-[#555]">{formatDate(u.createdAt)}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.isSuspended ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"
                      }`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.isSuspended ? (
                          <form action={async () => { "use server"; await unsuspendUser(u.id); }}>
                            <button type="submit" className="flex items-center gap-1 text-[11px] text-[#22c55e] hover:opacity-80 font-medium">
                              <UserCheck size={12} /> Unsuspend
                            </button>
                          </form>
                        ) : (
                          <form action={async () => { "use server"; await suspendUser(u.id); }}>
                            <button type="submit" className="flex items-center gap-1 text-[11px] text-[#ef4444] hover:opacity-80 font-medium">
                              <UserX size={12} /> Suspend
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
