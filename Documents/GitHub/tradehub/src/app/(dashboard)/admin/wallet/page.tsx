import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getAdminWallets, adminCreditWallet, adminDebitWallet,
  adminFreezeUser, adminUnfreezeUser, getSiteConfig, updateSiteConfig,
} from "@/lib/actions/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, PlusCircle, MinusCircle, Lock, Unlock, Wallet } from "lucide-react";

const DEPOSIT_CFG = [
  { key: "deposit_usdt_trc20", label: "USDT — TRC-20", placeholder: "T…", hint: "Tron network address starting with T" },
  { key: "deposit_usdt_erc20", label: "USDT — ERC-20", placeholder: "0x…", hint: "Ethereum network address" },
  { key: "deposit_usdt_bep20", label: "USDT — BEP-20", placeholder: "0x…", hint: "BNB Smart Chain address" },
  { key: "deposit_btc",        label: "Bitcoin — BTC",  placeholder: "bc1… or 1… or 3…", hint: "Native SegWit, Legacy, or P2SH" },
];

export default async function AdminWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const [wallets, cfg] = await Promise.all([getAdminWallets(), getSiteConfig()]);
  const depositAddresses: Record<string, string> = {
    deposit_usdt_trc20: cfg.deposit_usdt_trc20 ?? "",
    deposit_usdt_erc20: cfg.deposit_usdt_erc20 ?? "",
    deposit_usdt_bep20: cfg.deposit_usdt_bep20 ?? "",
    deposit_btc:        cfg.deposit_btc ?? "",
  };

  return (
    <div className="space-y-10">
      {/* ── Platform Deposit Addresses ── */}
      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet size={20} className="text-[#f0b429]" /> Platform Deposit Addresses
          </h1>
          <p className="text-[13px] text-[#555] mt-1">
            These addresses are shown to users on the deposit screen. Set one address per network.
          </p>
        </div>

        {sp.saved && (
          <div className="mb-4 p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[13px]">
            Deposit addresses saved successfully.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEPOSIT_CFG.map(({ key, label, placeholder, hint }) => (
            <div key={key} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-white uppercase tracking-wide">{label}</span>
                {depositAddresses[key] && (
                  <span className="text-[9px] bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Set
                  </span>
                )}
              </div>
              <form
                action={async (fd: FormData) => {
                  "use server";
                  const val = (fd.get("address") as string).trim();
                  if (val) await updateSiteConfig(key, val);
                  revalidatePath("/admin/wallet");
                  redirect("/admin/wallet?saved=1");
                }}
                className="space-y-2"
              >
                <input
                  name="address"
                  type="text"
                  defaultValue={depositAddresses[key]}
                  placeholder={placeholder}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[12px] text-white placeholder:text-[#444] font-mono outline-none focus:border-[#f0b429]/50 transition-colors"
                />
                <p className="text-[10px] text-[#444]">{hint}</p>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#f0b429] hover:bg-[#e0a424] text-black text-[11px] font-bold rounded-lg uppercase tracking-wide transition-colors"
                >
                  Save Address
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* ── User Wallet Management ── */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">User Wallet Management</h2>
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
                  revalidatePath("/admin/wallet");
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
                  revalidatePath("/admin/wallet");
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
                    <form action={async () => { "use server"; await adminUnfreezeUser(u.id); revalidatePath("/admin/wallet"); }}>
                      <button type="submit" className="w-full py-1.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5">
                        <Unlock size={12} /> Unfreeze Account
                      </button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await adminFreezeUser(u.id); revalidatePath("/admin/wallet"); }}>
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
    </div>
  );
}
