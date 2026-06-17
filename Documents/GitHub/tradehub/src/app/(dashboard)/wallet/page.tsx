import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getWallet, getTransactionHistory, getWalletStats } from "@/lib/actions/wallet";
import WalletClient from "./WalletClient";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, transactions, stats] = await Promise.all([
    getWallet(),
    getTransactionHistory(),
    getWalletStats(),
  ]);

  return <WalletClient wallet={wallet} transactions={transactions} stats={stats} />;
}
