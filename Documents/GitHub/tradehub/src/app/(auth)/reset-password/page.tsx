"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/auth";
import { Logo } from "@/components/Logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await resetPassword({
        token,
        newPassword: form.get("newPassword") as string,
      });
      if (result.success) {
        setSubmitted(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sm:p-8">
      <h1 className="text-[20px] font-bold text-white mb-1">Set new password</h1>
      <p className="text-[13px] text-[#555] mb-6">Choose a new password for your account</p>

      {!token ? (
        <div className="p-4 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[13px]">
          Missing or invalid reset link. Please request a new one.
        </div>
      ) : submitted ? (
        <div className="p-4 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[13px]">
          Password updated. Redirecting to sign in…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[12px]">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="newPassword" className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
              New password
            </label>
            <input id="newPassword" name="newPassword" type="password" required autoComplete="new-password"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
            <p className="mt-1.5 text-[11px] text-[#444]">Min 8 chars · 1 uppercase · 1 number</p>
          </div>
          <button type="submit" disabled={isPending}
            className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors mt-2">
            {isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[12px] text-[#555]">
        <Link href="/login" className="text-[#f0b429] hover:opacity-80 font-semibold">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo href="/home" size={36} textTheme="light" />
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
