"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

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

export async function purchaseMembership({ planId }: { planId: string }): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

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

  await prisma.membership.create({
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

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: plan.price } },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      userId: session.userId,
      type: "WITHDRAWAL",
      amount: plan.price,
      status: "COMPLETED",
      description: `Membership: ${plan.name}`,
    },
  });

  return { success: true };
}

export async function cancelMembership({ membershipId }: { membershipId: string }): Promise<ActionResult> {
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
