import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getWallet, getTransactionHistory, getWalletStats } from "@/lib/actions/wallet";
import { getPublicSiteConfig } from "@/lib/actions/admin";
import WalletClient from "./WalletClient";

const DEPOSIT_KEYS = [
  "deposit_usdt_trc20",
  "deposit_usdt_erc20",
  "deposit_usdt_bep20",
  "deposit_btc",
];

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, transactions, stats, cfg] = await Promise.all([
    getWallet(),
    getTransactionHistory(),
    getWalletStats(),
    getPublicSiteConfig(DEPOSIT_KEYS),
  ]);

  const depositAddresses = {
    TRC20: cfg.deposit_usdt_trc20 ?? "",
    ERC20: cfg.deposit_usdt_erc20 ?? "",
    BEP20: cfg.deposit_usdt_bep20 ?? "",
    BTC:   cfg.deposit_btc ?? "",
  };

  return (
    <WalletClient
      wallet={wallet}
      transactions={transactions}
      stats={stats}
      depositAddresses={depositAddresses}
    />
  );
}
