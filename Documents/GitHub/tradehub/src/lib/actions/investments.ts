"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification, sendEmailNotification } from "@/lib/notifications";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/* ── User-facing actions ── */

export async function getInvestmentPlans() {
  return prisma.investmentPlan.findMany({
    where: { isActive: true },
    orderBy: { minAmount: "asc" },
  });
}

export async function getMyInvestments() {
  const session = await getSession();
  if (!session) return [];

  return prisma.userInvestment.findMany({
    where: { userId: session.userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function purchaseInvestment({
  planId,
  amount,
}: {
  planId: string;
  amount: number;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const ip = await getClientIp();
  const rl = checkRateLimit(`invest:${session.userId}:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { success: false, error: `Too many investment requests. Try again in ${rl.retryAfterSeconds}s.` };
  }

  const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return { success: false, error: "Plan not found or unavailable" };
  if (amount < plan.minAmount) {
    return { success: false, error: `Minimum investment for this plan is $${plan.minAmount}` };
  }

  const expectedPayout = amount + amount * (plan.roiPercent / 100);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: session.userId } });
    if (!wallet || wallet.balance < amount) return null;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });

    const investment = await tx.userInvestment.create({
      data: {
        userId: session.userId,
        planId,
        amount,
        expectedPayout,
        endDate,
      },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: session.userId,
        type: "INVESTMENT",
        amount,
        status: "COMPLETED",
        description: `Investment in ${plan.name}`,
      },
    });

    return investment;
  });

  if (!result) return { success: false, error: "Insufficient wallet balance" };

  await createNotification(
    session.userId,
    "INVESTMENT_CREATED",
    "Investment Started",
    `Your investment of $${amount} in "${plan.name}" has started. Matures on ${endDate.toLocaleDateString()}.`
  );

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } });
  if (user) {
    await sendEmailNotification(
      user.email,
      `Investment Plan Started — StoxOptionHub`,
      `<p>Hi ${user.name},</p><p>Your investment of <strong>$${amount}</strong> in <strong>${plan.name}</strong> is now active.</p><p>Plan duration: ${plan.durationDays} days. Maturity date: ${endDate.toLocaleDateString()}.</p><p>Returns are market-dependent and not guaranteed.</p>`
    );
  }

  return { success: true };
}

/* ─────────────────────────────────────────────────────────────────
   processMaturities — idempotent via updateMany with status=ACTIVE
   Safe to call multiple times; skips already-processed investments.
──────────────────────────────────────────────────────────────────── */
export async function processMaturities(): Promise<{ processed: number; skipped: number }> {
  const now = new Date();

  const matureInvestments = await prisma.userInvestment.findMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    include: { user: { select: { email: true, name: true } }, plan: true },
  });

  let processed = 0;
  let skipped = 0;

  for (const inv of matureInvestments) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: inv.userId } });
    if (!wallet) { skipped++; continue; }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.userInvestment.updateMany({
        where: { id: inv.id, status: "ACTIVE" },
        data: { status: "COMPLETED", completedAt: now },
      });
      if (updated.count === 0) return null;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: inv.expectedPayout } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: inv.userId,
          type: "PAYOUT",
          amount: inv.expectedPayout,
          status: "COMPLETED",
          description: `Payout from ${inv.plan.name}`,
        },
      });

      return true;
    });

    if (result) {
      processed++;
      await createNotification(
        inv.userId,
        "INVESTMENT_MATURED",
        "Investment Matured",
        `Your investment in "${inv.plan.name}" has completed. $${inv.expectedPayout.toFixed(2)} has been credited to your wallet.`
      );
      if (inv.user.email) {
        await sendEmailNotification(
          inv.user.email,
          "Investment Matured — StoxOptionHub",
          `<p>Hi ${inv.user.name},</p><p>Your investment in <strong>${inv.plan.name}</strong> has reached maturity. <strong>$${inv.expectedPayout.toFixed(2)}</strong> has been credited to your wallet.</p><p>Returns are market-dependent. Log in to view your updated balance.</p>`
        );
      }
    } else {
      skipped++;
    }
  }

  return { processed, skipped };
}

/* ── Admin actions ── */

export async function getAllInvestments({
  userId,
  status,
  page = 1,
  limit = 20,
}: {
  userId?: string;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  page?: number;
  limit?: number;
} = {}) {
  const session = await requireAdmin();
  if (!session) return [];

  return prisma.userInvestment.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function createInvestmentPlan(data: {
  name: string;
  description: string;
  minAmount: number;
  durationDays: number;
  roiPercent: number;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };

  if (!data.name.trim()) return { success: false, error: "Name is required" };
  if (data.minAmount <= 0) return { success: false, error: "Minimum amount must be positive" };
  if (data.durationDays <= 0) return { success: false, error: "Duration must be positive" };

  await prisma.investmentPlan.create({ data });
  return { success: true };
}

export async function updateInvestmentPlan(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    minAmount: number;
    durationDays: number;
    roiPercent: number;
  }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };

  await prisma.investmentPlan.update({ where: { id }, data });
  return { success: true };
}

export async function toggleInvestmentPlan(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };

  const plan = await prisma.investmentPlan.findUnique({ where: { id }, select: { isActive: true } });
  if (!plan) return { success: false, error: "Plan not found" };

  await prisma.investmentPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
  return { success: true };
}
