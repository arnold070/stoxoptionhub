"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/actions/auth";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginUser({ email: form.get("email") as string, password: form.get("password") as string });
      if (result.success) { router.push("/dashboard"); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo href="/home" size={36} textTheme="light" />
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sm:p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">Welcome back</h1>
          <p className="text-[13px] text-[#555] mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[12px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input id="email" name="email" type="email" required autoComplete="email"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] font-medium text-[#888] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] text-[#f0b429] hover:opacity-80">
                  Forgot password?
                </Link>
              </div>
              <input id="password" name="password" type="password" required autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors mt-2">
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#555]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#f0b429] hover:opacity-80 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
