"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult =
  | { success: true; traderName: string }
  | { success: false; error: string };

export async function getPlans() {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getUserMemberships() {
  const session = await getSession();
  if (!session) return [];

  return prisma.membership.findMany({
    where: { userId: session.userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function purchaseMembership({
  planId,
  hashCode,
}: {
  planId: string;
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

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return { success: false, error: "Plan not found" };

  const existing = await prisma.membership.findFirst({
    where: { userId: session.userId, planId, status: "ACTIVE" },
  });
  if (existing) return { success: false, error: "Already have an active membership for this plan" };

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet || wallet.balance < plan.price) {
    return { success: false, error: "Insufficient wallet balance" };
  }

  const now = new Date();
  const endDate = plan.duration
    ? new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000)
    : null;

  try {
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { userId: session.userId } });
      if (!w || w.balance < plan.price) throw new Error("INSUFFICIENT_BALANCE");

      await tx.membership.create({
        data: {
          userId: session.userId,
          planId,
          status: "ACTIVE",
          startDate: now,
          endDate,
          paidAt: now,
          amount: plan.price,
        },
      });

      await tx.wallet.update({
        where: { id: w.id },
        data: { balance: { decrement: plan.price } },
      });

      await tx.transaction.create({
        data: {
          walletId: w.id,
          userId: session.userId,
          type: "WITHDRAWAL",
          amount: plan.price,
          status: "COMPLETED",
          description: `Membership: ${plan.name}`,
        },
      });
    });
  } catch (e: unknown) {
    if ((e as Error).message === "INSUFFICIENT_BALANCE") {
      return { success: false, error: "Insufficient wallet balance" };
    }
    console.error("[purchaseMembership]", e);
    return { success: false, error: "Purchase failed. Please try again." };
  }

  return { success: true, traderName: trader.name };
}

export async function cancelMembership({ membershipId }: { membershipId: string }): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, userId: session.userId, status: "ACTIVE" },
  });
  if (!membership) return { success: false, error: "Membership not found" };

  await prisma.membership.update({
    where: { id: membershipId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}
