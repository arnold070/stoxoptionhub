"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function getStrategies() {
  return prisma.strategy.findMany({
    where: { isActive: true },
    include: { _count: { select: { allocations: { where: { status: "ACTIVE" } } } } },
    orderBy: { minAmount: "asc" },
  });
}

export async function getUserAllocations() {
  const session = await getSession();
  if (!session) return [];

  return prisma.allocation.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: { strategy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function allocateToStrategy({
  strategyId,
  amount,
  hashCode,
}: {
  strategyId: string;
  amount: number;
  hashCode: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const trimmedCode = (hashCode ?? "").trim();
  if (!trimmedCode) return { success: false, error: "Trading code is required." };

  const trader = await prisma.trader.findUnique({ where: { hashCode: trimmedCode } });
  if (!trader || !trader.isActive) {
    return { success: false, error: "Invalid trading code. Contact your admin for a valid code." };
  }

  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy || !strategy.isActive) return { success: false, error: "Plan not found" };

  if (amount < strategy.minAmount) {
    return {
      success: false,
      error: `Amount below the minimum of $${strategy.minAmount.toLocaleString()}`,
    };
  }

  if (strategy.maxAmount && amount > strategy.maxAmount) {
    return {
      success: false,
      error: `Amount exceeds the maximum of $${strategy.maxAmount.toLocaleString()}`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
      if (!wallet || wallet.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

      await tx.allocation.create({
        data: {
          userId: session.userId,
          strategyId,
          traderId: trader.id,
          amount,
          status: "ACTIVE",
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: session.userId,
          type: "ALLOCATION_OUT",
          amount,
          status: "COMPLETED",
          description: `Allocated to ${strategy.name}`,
        },
      });
    });
  } catch (e: unknown) {
    if ((e as Error).message === "INSUFFICIENT_BALANCE") {
      return { success: false, error: "Insufficient wallet balance" };
    }
    console.error("[allocateToStrategy]", e);
    return { success: false, error: "Allocation failed. Please try again." };
  }

  return { success: true };
}

export async function withdrawFromStrategy({
  allocationId,
}: {
  allocationId: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const allocation = await prisma.allocation.findFirst({
    where: { id: allocationId, userId: session.userId, status: "ACTIVE" },
    include: { strategy: true },
  });

  if (!allocation) return { success: false, error: "Allocation not found" };

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      await tx.allocation.update({
        where: { id: allocationId },
        data: { status: "WITHDRAWN" },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: allocation.amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: session.userId,
          type: "ALLOCATION_IN",
          amount: allocation.amount,
          status: "COMPLETED",
          description: `Withdrew from ${(allocation as any).strategy.name}`,
        },
      });
    });
  } catch (e: unknown) {
    if ((e as Error).message === "WALLET_NOT_FOUND") {
      return { success: false, error: "Wallet not found" };
    }
    console.error("[withdrawFromStrategy]", e);
    return { success: false, error: "Withdrawal failed. Please try again." };
  }

  return { success: true };
}
