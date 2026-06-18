import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAdminWallets, adminCreditWallet, adminDebitWallet, adminFreezeUser, adminUnfreezeUser } from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, PlusCircle, MinusCircle, Lock, Unlock } from "lucide-react";

export default async function AdminWalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const wallets = await getAdminWallets();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
        <p className="text-[13px] text-[#555] mt-1">Credit, debit, and freeze user wallets. All changes are logged and audited.</p>
      </div>

      <div className="space-y-4">
        {wallets.length === 0 && (
          <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-10 text-center">
            <CreditCard size={28} className="text-[#333] mx-auto mb-3" />
            <p className="text-[#555] text-[13px]">No wallets found</p>
          </div>
        )}
        {wallets.map((w) => {
          const u = (w as any).user;
          const recentTx = (w as any).transactions as Array<{ id: string; type: string; amount: number; status: string; createdAt: string }>;
          return (
            <div key={w.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
              <div className="p-5 border-b border-[#1e1e1e]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[13px] font-bold text-white shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-[14px]">{u.name}</p>
                      <p className="text-[11px] text-[#555]">{u.email} · {u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-[#22c55e]">{formatCurrency(w.balance)}</p>
                      <p className="text-[10px] text-[#555]">{w.currency}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      u.isSuspended ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"
                    }`}>{u.isSuspended ? "Frozen" : "Active"}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Credit */}
                <form action={async (fd: FormData) => {
                  "use server";
                  await adminCreditWallet(u.id, Number(fd.get("amount")), fd.get("description") as string);
                }} className="space-y-2">
                  <p className="text-[10px] text-[#22c55e] uppercase tracking-wider font-bold flex items-center gap-1"><PlusCircle size={11} /> Credit Wallet</p>
                  <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount (USD)" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#22c55e]/50" />
                  <input name="description" required placeholder="Reason / note" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#22c55e]/50" />
                  <button type="submit" className="w-full py-1.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20 rounded-lg text-[12px] font-bold transition-colors">Credit</button>
                </form>

                {/* Debit */}
                <form action={async (fd: FormData) => {
                  "use server";
                  await adminDebitWallet(u.id, Number(fd.get("amount")), fd.get("description") as string);
                }} className="space-y-2">
                  <p className="text-[10px] text-[#ef4444] uppercase tracking-wider font-bold flex items-center gap-1"><MinusCircle size={11} /> Debit Wallet</p>
                  <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount (USD)" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#ef4444]/50" />
                  <input name="description" required placeholder="Reason / note" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#ef4444]/50" />
                  <button type="submit" className="w-full py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 rounded-lg text-[12px] font-bold transition-colors">Debit</button>
                </form>

                {/* Freeze / Recent */}
                <div className="space-y-2">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold flex items-center gap-1"><Lock size={11} /> Account Controls</p>
                  {u.isSuspended ? (
                    <form action={async () => { "use server"; await adminUnfreezeUser(u.id); }}>
                      <button type="submit" className="w-full py-1.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5">
                        <Unlock size={12} /> Unfreeze Account
                      </button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await adminFreezeUser(u.id); }}>
                      <button type="submit" className="w-full py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5">
                        <Lock size={12} /> Freeze Account
                      </button>
                    </form>
                  )}
                  <div className="space-y-1 mt-1">
                    {recentTx.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-[10px]">
                        <span className="text-[#555]">{tx.type.toLowerCase().replace(/_/g, " ")}</span>
                        <span className={tx.amount >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>{formatCurrency(Math.abs(tx.amount))}</span>
                      </div>
                    ))}
                    {recentTx.length === 0 && <p className="text-[10px] text-[#444]">No recent transactions</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
