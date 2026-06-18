"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerUser({
        name: form.get("name") as string,
        email: form.get("email") as string,
        password: form.get("password") as string,
        usdtAddress: form.get("usdtAddress") as string,
        btcAddress: form.get("btcAddress") as string,
        bnbAddress: form.get("bnbAddress") as string,
      });
      if (result.success) { router.push("/dashboard"); router.refresh(); }
      else setError(result.error);
    });
  }

  const inputCls = "w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors font-mono";
  const labelCls = "block text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo href="/home" size={36} textTheme="light" />
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 sm:p-8">
          <h1 className="text-[20px] font-bold text-white mb-1">Create account</h1>
          <p className="text-[13px] text-[#555] mb-6">Join the institutional trading community</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-[12px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelCls}>Full name</label>
              <input id="name" name="name" type="text" required autoComplete="name"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email address</label>
              <input id="email" name="email" type="email" required autoComplete="email"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <input id="password" name="password" type="password" required autoComplete="new-password"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[13px] text-white placeholder:text-[#444] outline-none focus:border-[#f0b429]/50 transition-colors" />
              <p className="mt-1.5 text-[11px] text-[#444]">Min 8 chars · 1 uppercase · 1 number</p>
            </div>

            {/* Wallet addresses toggle */}
            <button
              type="button"
              onClick={() => setShowWallets((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors"
            >
              <span>Add withdrawal wallet addresses <span className="text-[#444]">(optional)</span></span>
              {showWallets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showWallets && (
              <div className="space-y-3 p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                <p className="text-[11px] text-[#555] leading-relaxed mb-3">
                  Your withdrawal addresses are used when you request a payout. You can also add or update them later in Settings.
                </p>
                <div>
                  <label htmlFor="usdtAddress" className={labelCls}>
                    USDT Wallet <span className="text-[#f0b429]">TRC-20</span>
                  </label>
                  <input
                    id="usdtAddress"
                    name="usdtAddress"
                    type="text"
                    placeholder="T..."
                    autoComplete="off"
                    spellCheck={false}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="btcAddress" className={labelCls}>
                    Bitcoin Wallet <span className="text-[#f97316]">BTC</span>
                  </label>
                  <input
                    id="btcAddress"
                    name="btcAddress"
                    type="text"
                    placeholder="bc1... or 1... or 3..."
                    autoComplete="off"
                    spellCheck={false}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="bnbAddress" className={labelCls}>
                    BNB Wallet <span className="text-[#f0b429]">BEP-20</span>
                  </label>
                  <input
                    id="bnbAddress"
                    name="bnbAddress"
                    type="text"
                    placeholder="0x..."
                    autoComplete="off"
                    spellCheck={false}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-[#f0b429] hover:bg-[#e0a424] disabled:opacity-50 text-black text-[13px] font-bold rounded-lg uppercase tracking-wide transition-colors mt-2">
              {isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#555]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#f0b429] hover:opacity-80 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
