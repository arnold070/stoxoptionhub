"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

const MIN_DEPOSIT = 10;
const MIN_WITHDRAWAL = 20;

type ActionResult = { success: true } | { success: false; error: string };


export async function getWallet() {
  const session = await getSession();
  if (!session) return null;
  return prisma.wallet.findUnique({ where: { userId: session.userId } });
}

export async function getTransactionHistory(page = 1, limit = 20) {
  const session = await getSession();
  if (!session) return [];

  return prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getMyDeposits(page = 1, limit = 20) {
  const session = await getSession();
  if (!session) return [];

  return prisma.transaction.findMany({
    where: { userId: session.userId, type: "DEPOSIT" },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function requestDeposit({
  amount,
  network,
  txHash,
  notes,
}: {
  amount: number;
  network: string;
  txHash: string;
  notes?: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const ip = await getClientIp();
  const rl = checkRateLimit(`deposit:${session.userId}:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { success: false, error: `Too many deposit requests. Try again in ${rl.retryAfterSeconds}s.` };
  }

  if (amount < MIN_DEPOSIT) {
    return { success: false, error: `Minimum deposit is $${MIN_DEPOSIT}` };
  }
  if (!network.trim()) return { success: false, error: "Network is required" };
  if (!txHash.trim()) return { success: false, error: "Transaction hash is required" };

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) return { success: false, error: "Wallet not found" };

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId: session.userId,
      type: "DEPOSIT",
      amount,
      status: "PENDING",
      txHash: txHash.trim(),
      network: network.trim(),
      description: notes?.trim() || "Crypto deposit request",
    },
  });

  await createNotification(
    session.userId,
    "DEPOSIT_SUBMITTED",
    "Deposit Submitted",
    `Your deposit of $${amount} has been submitted and is pending admin review.`
  );

  return { success: true };
}

export async function requestWithdrawal({
  amount,
  address,
}: {
  amount: number;
  address: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const ip = await getClientIp();
  const rl = checkRateLimit(`withdrawal:${session.userId}:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { success: false, error: `Too many withdrawal requests. Try again in ${rl.retryAfterSeconds}s.` };
  }

  if (amount < MIN_WITHDRAWAL) {
    return { success: false, error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` };
  }
  if (!address.trim()) return { success: false, error: "Destination address is required" };

  const reserved = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
    if (!wallet) return null;
    if (wallet.balance < amount) return "insufficient";

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: session.userId,
        type: "WITHDRAWAL",
        amount,
        status: "PENDING",
        txHash: address.trim(),
        description: `Withdrawal to ${address.trim()}`,
      },
    });

    return "ok";
  });

  if (reserved === null) return { success: false, error: "Wallet not found" };
  if (reserved === "insufficient") return { success: false, error: "Insufficient wallet balance" };

  return { success: true };
}

export async function getWalletStats() {
  const session = await getSession();
  if (!session) return { allocated: 0, pendingDeposits: 0, activeInvestmentCount: 0 };

  const [investmentAgg, pendingAgg, activeInvestmentCount] = await Promise.all([
    prisma.userInvestment.aggregate({
      where: { userId: session.userId, status: "ACTIVE" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.userId, type: "DEPOSIT", status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.userInvestment.count({
      where: { userId: session.userId, status: "ACTIVE" },
    }),
  ]);

  return {
    allocated: investmentAgg._sum.amount ?? 0,
    pendingDeposits: pendingAgg._sum.amount ?? 0,
    activeInvestmentCount,
  };
}
