import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { adminCreateUser } from "@/lib/actions/admin";
import { ArrowLeft, UserPlus } from "lucide-react";

export default async function AdminNewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Users
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus size={20} className="text-[#f0b429]" /> Create New User
        </h1>
        <p className="text-[13px] text-[#555] mt-1">
          Manually create a member account with instant access.
        </p>
      </div>

      {sp.error && (
        <div className="mb-5 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
          {sp.error}
        </div>
      )}
      {sp.success && (
        <div className="mb-5 p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[13px]">
          User created successfully.{" "}
          <Link href="/admin/users" className="underline font-semibold">
            View all users →
          </Link>
        </div>
      )}

      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
        <form
          action={async (fd: FormData) => {
            "use server";
            const result = await adminCreateUser({
              name: fd.get("name") as string,
              email: fd.get("email") as string,
              password: fd.get("password") as string,
              role: (fd.get("role") as "MEMBER" | "MENTOR" | "TRADER" | "ADMIN") || "MEMBER",
            });
            if (result.success) {
              revalidatePath("/admin/users");
              redirect("/admin/users/new?success=1");
            } else {
              redirect(`/admin/users/new?error=${encodeURIComponent(result.error ?? "Creation failed")}`);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="John Smith"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="john@example.com"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#444]">
              The user can change their password after logging in.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              name="role"
              defaultValue="MEMBER"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white outline-none focus:border-[#f0b429]/50 transition-colors"
            >
              <option value="MEMBER">Member</option>
              <option value="MENTOR">Mentor</option>
              <option value="TRADER">Trader</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[13px] font-bold rounded-xl uppercase tracking-wide transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
