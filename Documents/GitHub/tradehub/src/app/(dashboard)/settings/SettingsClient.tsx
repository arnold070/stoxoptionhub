"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword } from "@/lib/actions/auth";
import { formatDate } from "@/lib/utils";
import { User as UserIcon, Lock, ShieldCheck } from "lucide-react";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
};

const inputCls = "w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors";
const labelCls = "block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5";

export default function SettingsClient({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setProfileMessage(null);
    startProfileTransition(async () => {
      const result = await updateProfile({
        name: form.get("name") as string,
        phone: form.get("phone") as string,
      });
      if (result.success) {
        setProfileMessage({ type: "success", text: "Profile updated successfully." });
        router.refresh();
      } else {
        setProfileMessage({ type: "error", text: result.error });
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPasswordMessage(null);
    startPasswordTransition(async () => {
      const result = await changePassword({
        currentPassword: form.get("currentPassword") as string,
        newPassword: form.get("newPassword") as string,
      });
      if (result.success) {
        setPasswordMessage({ type: "success", text: "Password changed successfully." });
        (e.target as HTMLFormElement).reset();
      } else {
        setPasswordMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[13px] text-[#555] mt-1">Manage your account profile and security</p>
      </div>

      {/* Account overview */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[16px] font-semibold text-white shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-white truncate">{user.name}</div>
            <div className="text-[12px] text-[#555] truncate">{user.email}</div>
          </div>
        </div>
        <div className="sm:text-right sm:ml-auto shrink-0">
          <div className="flex items-center gap-1.5 sm:justify-end text-[11px] text-[#f0b429] font-semibold uppercase tracking-wider">
            <ShieldCheck size={13} />
            {user.role}
          </div>
          <div className="text-[11px] text-[#444] mt-1">Member since {formatDate(user.createdAt)}</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
        <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
          <UserIcon size={16} className="text-[#f0b429]" /> Profile Information
        </h2>
        <p className="text-[12px] text-[#555] mb-5">Update your personal details</p>

        {profileMessage && (
          <div className={`mb-4 p-3 rounded-lg text-[12px] ${
            profileMessage.type === "success"
              ? "bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]"
              : "bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444]"
          }`}>
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className={labelCls}>Full name</label>
            <input id="name" name="name" type="text" required defaultValue={user.name} className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email address</label>
            <input id="email" name="email" type="email" value={user.email} disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone number</label>
            <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="Optional" className={inputCls} />
          </div>
          <button type="submit" disabled={isProfilePending}
            className="px-5 py-2.5 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
            {isProfilePending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 sm:p-6">
        <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
          <Lock size={16} className="text-[#f0b429]" /> Change Password
        </h2>
        <p className="text-[12px] text-[#555] mb-5">Update your account password</p>

        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-lg text-[12px] ${
            passwordMessage.type === "success"
              ? "bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]"
              : "bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444]"
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className={labelCls}>Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={inputCls} />
          </div>
          <div>
            <label htmlFor="newPassword" className={labelCls}>New password</label>
            <input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" className={inputCls} />
            <p className="mt-1.5 text-[11px] text-[#444]">Min 8 chars · 1 uppercase · 1 number</p>
          </div>
          <button type="submit" disabled={isPasswordPending}
            className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] disabled:opacity-50 text-white text-[12px] font-bold rounded-lg uppercase tracking-wide transition-colors">
            {isPasswordPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
