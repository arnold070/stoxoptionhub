import { redirect } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/actions/auth";
import { getWallet } from "@/lib/actions/wallet";
import { prisma } from "@/lib/prisma";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallet, rawNotifications] = await Promise.all([
    getWallet().catch(() => null),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []),
  ]);

  const balance = wallet?.balance ?? 0;
  const formattedBalance = balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    type: n.type as string,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  async function signOutAction() {
    "use server";
    await logoutUser();
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={user.name}
      isAdmin={user.role === "ADMIN"}
      formattedBalance={formattedBalance}
      signOutAction={signOutAction}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
