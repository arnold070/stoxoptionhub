"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function getStrategies() {
  return prisma.strategy.findMany({
    where: { isActive: true },
    include: { _count: { select: { allocations: { where: { status: "ACTIVE" } } } } },
    orderBy: { tier: "asc" },
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
}: {
  strategyId: string;
  amount: number;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy || !strategy.isActive) return { success: false, error: "Strategy not found" };

  if (amount < strategy.minAmount) {
    return {
      success: false,
      error: `Amount below minimum allocation of ${strategy.minAmount}`,
    };
  }

  if (strategy.maxAmount && amount > strategy.maxAmount) {
    return {
      success: false,
      error: `Amount exceeds maximum allocation of ${strategy.maxAmount}`,
    };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet || wallet.balance < amount) {
    return { success: false, error: "Insufficient wallet balance" };
  }

  await prisma.allocation.create({
    data: {
      userId: session.userId,
      strategyId,
      amount,
      status: "ACTIVE",
    },
  });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: amount } },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId: session.userId,
      type: "ALLOCATION_OUT",
      amount,
      status: "COMPLETED",
      description: `Allocated to ${strategy.name}`,
    },
  });

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

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) return { success: false, error: "Wallet not found" };

  await prisma.allocation.update({
    where: { id: allocationId },
    data: { status: "WITHDRAWN" },
  });

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: allocation.amount } },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId: session.userId,
      type: "ALLOCATION_IN",
      amount: allocation.amount,
      status: "COMPLETED",
      description: `Withdrew from ${(allocation as any).strategy.name}`,
    },
  });

  return { success: true };
}
