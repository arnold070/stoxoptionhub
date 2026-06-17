"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Zap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset({ email: form.get("email") as string });
      if (result.success) setSubmitted(true);
      else setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] flex items-center justify-center shrink-0">
            <Zap size={18} className="text-[#f0b429]" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-white">StoxOptionHub</div>
            <div className="text-[9px] text-[#444] uppercase tracking-widest">Institutional Grade</div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sm:p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">Reset password</h1>
          <p className="text-[13px] text-[#555] mb-6">
            Enter your email and we&apos;ll send you a reset link
          </p>

          {submitted ? (
            <div className="p-4 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[13px]">
              If an account exists for that email, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[12px]">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input id="email" name="email" type="email" required autoComplete="email"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors mt-2">
                {isPending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[12px] text-[#555]">
            Remembered your password?{" "}
            <Link href="/login" className="text-[#f0b429] hover:opacity-80 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
