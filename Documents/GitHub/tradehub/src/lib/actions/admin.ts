"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification, sendEmailNotification } from "@/lib/notifications";
import type { Role, TransactionStatus, TransactionType, StrategyTier, ContentType, CommunityType } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function getUsers() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.user.findMany({
    omit: { password: true },
    include: {
      memberships: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
      wallet: { select: { id: true, balance: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: true } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: "SUSPEND_USER", entity: "User", entityId: userId },
  });
  return { success: true };
}

export async function unsuspendUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: false } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: "UNSUSPEND_USER", entity: "User", entityId: userId },
  });
  return { success: true };
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: "UPDATE_ROLE", entity: "User", entityId: userId, details: role },
  });
  return { success: true };
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function getPendingTransactions() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.transaction.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDepositRequests({
  status,
  network,
  userId,
  page = 1,
  limit = 20,
}: {
  status?: TransactionStatus;
  network?: string;
  userId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.transaction.findMany({
    where: {
      type: "DEPOSIT",
      ...(status ? { status } : {}),
      ...(network ? { network } : {}),
      ...(userId ? { userId } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getAllTransactions({
  type,
  userId,
  status,
  page = 1,
  limit = 20,
}: {
  type?: TransactionType;
  userId?: string;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
} = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.transaction.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getWithdrawalRequests({
  status,
  userId,
  page = 1,
  limit = 20,
}: {
  status?: TransactionStatus;
  userId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.transaction.findMany({
    where: {
      type: "WITHDRAWAL",
      ...(status ? { status } : {}),
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { name: true, email: true, usdtAddress: true, btcAddress: true, bnbAddress: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function approveTransaction(transactionId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({
      where: { id: transactionId, status: "PENDING" },
      data: { status: "APPROVED", approvedBy: session.userId, approvedAt: new Date() },
    });
    if (updated.count === 0) return null;

    const deposit = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!deposit) return null;

    if (deposit.type === "DEPOSIT") {
      await tx.wallet.update({
        where: { id: deposit.walletId },
        data: { balance: { increment: deposit.amount } },
      });
    }
    return deposit;
  });

  if (!result) return { success: false, error: "Transaction already processed or not found" };

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "APPROVE_TRANSACTION", entity: "Transaction", entityId: transactionId },
  });

  const user = await prisma.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true } });
  if (user) {
    await createNotification(
      result.userId,
      result.type === "DEPOSIT" ? "DEPOSIT_APPROVED" : "WALLET_CREDIT",
      result.type === "DEPOSIT" ? "Deposit Approved" : "Transaction Approved",
      `Your ${result.type.toLowerCase()} of $${result.amount} has been approved.`
    );
    await sendEmailNotification(
      user.email,
      `${result.type === "DEPOSIT" ? "Deposit" : "Transaction"} Approved — StoxOptionHub`,
      `<p>Hi ${user.name},</p><p>Your ${result.type.toLowerCase()} of <strong>$${result.amount}</strong> has been approved. Your wallet balance has been updated.</p>`
    );
  }
  return { success: true };
}

export async function rejectTransaction(transactionId: string, reason?: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({
      where: { id: transactionId, status: "PENDING" },
      data: { status: "REJECTED", rejectedAt: new Date(), adminNote: reason ?? null },
    });
    if (updated.count === 0) return null;

    const record = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!record) return null;

    if (record.type === "WITHDRAWAL") {
      await tx.wallet.update({
        where: { id: record.walletId },
        data: { balance: { increment: record.amount } },
      });
    }
    return record;
  });

  if (!result) return { success: false, error: "Transaction already processed or not found" };

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "REJECT_TRANSACTION", entity: "Transaction", entityId: transactionId, details: reason },
  });

  const user = await prisma.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true } });
  if (user) {
    const isWithdrawal = result.type === "WITHDRAWAL";
    await createNotification(
      result.userId,
      "DEPOSIT_REJECTED",
      isWithdrawal ? "Withdrawal Rejected" : "Deposit Rejected",
      `Your ${isWithdrawal ? "withdrawal" : "deposit"} of $${result.amount} was rejected.${reason ? ` Reason: ${reason}` : ""}${isWithdrawal ? " Your funds have been returned." : ""}`
    );
    await sendEmailNotification(
      user.email,
      `${isWithdrawal ? "Withdrawal" : "Deposit"} Rejected — StoxOptionHub`,
      `<p>Hi ${user.name},</p><p>Your ${isWithdrawal ? "withdrawal" : "deposit"} of <strong>$${result.amount}</strong> could not be approved.${reason ? `<br/>Reason: ${reason}` : ""}${isWithdrawal ? "<br/>Your funds have been returned to your wallet." : ""}</p>`
    );
  }
  return { success: true };
}

// ─── Platform Stats ─────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const session = await requireAdmin();
  if (!session) return null;
  const [totalUsers, activeMembers, pendingTxCount] = await Promise.all([
    prisma.user.count(),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
  ]);
  return { totalUsers, activeMembers, pendingTxCount };
}

export async function getEnhancedPlatformStats() {
  const session = await requireAdmin();
  if (!session) return null;

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    pendingDeposits,
    approvedDeposits,
    pendingWithdrawals,
    approvedWithdrawals,
    activeMembers,
    totalInvestments,
    activeInvestments,
    totalStrategies,
    totalContent,
    totalPlans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSuspended: false } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.transaction.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
    prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "APPROVED" }, select: { amount: true } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.transaction.findMany({ where: { type: "WITHDRAWAL", status: "APPROVED" }, select: { amount: true } }),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.userInvestment.count(),
    prisma.userInvestment.findMany({ where: { status: "ACTIVE" }, select: { amount: true } }),
    prisma.strategy.count({ where: { isActive: true } }),
    prisma.content.count({ where: { isPublished: true } }),
    prisma.plan.count({ where: { isActive: true } }),
  ]);

  const totalDepositsRevenue = approvedDeposits.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawalsAmount = approvedWithdrawals.reduce((s, t) => s + t.amount, 0);
  const aum = activeInvestments.reduce((s, t) => s + t.amount, 0);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    pendingDeposits,
    totalDepositsRevenue,
    depositCount: approvedDeposits.length,
    pendingWithdrawals,
    totalWithdrawalsAmount,
    withdrawalCount: approvedWithdrawals.length,
    activeMembers,
    totalInvestments,
    aum,
    activeStrategies: totalStrategies,
    publishedContent: totalContent,
    activePlans: totalPlans,
  };
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export async function getAuditLogs({
  userId,
  action,
  page = 1,
  limit = 20,
}: {
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.auditLog.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(action ? { action } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

// ─── Mentorship Plans ───────────────────────────────────────────────────────

export async function getPlans() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { memberships: true } } },
  });
}

export async function createPlan(data: {
  name: string;
  price: number;
  duration?: number;
  description: string;
  benefits: string;
  maxMembers?: number;
  sortOrder?: number;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  try {
    await prisma.plan.create({ data });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_PLAN", entity: "Plan", details: data.name } });
    return { success: true };
  } catch {
    return { success: false, error: "Plan name already exists or invalid data" };
  }
}

export async function updatePlan(
  id: string,
  data: Partial<{ name: string; price: number; duration: number | null; description: string; benefits: string; maxMembers: number | null; isActive: boolean; sortOrder: number }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.plan.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_PLAN", entity: "Plan", entityId: id } });
  return { success: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  try {
    await prisma.plan.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_PLAN", entity: "Plan", entityId: id } });
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete plan with existing memberships" };
  }
}

// ─── Copy Trading Strategies ─────────────────────────────────────────────────

export async function getStrategies() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.strategy.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { allocations: true } } },
  });
}

export async function createStrategy(data: {
  name: string;
  description: string;
  tier: StrategyTier;
  minAmount: number;
  maxAmount?: number;
  performance?: number;
  managedBy?: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  try {
    await prisma.strategy.create({ data });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_STRATEGY", entity: "Strategy", details: data.name } });
    return { success: true };
  } catch {
    return { success: false, error: "Strategy name already exists or invalid data" };
  }
}

export async function updateStrategy(
  id: string,
  data: Partial<{ name: string; description: string; tier: StrategyTier; minAmount: number; maxAmount: number | null; performance: number; isActive: boolean; managedBy: string | null }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.strategy.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_STRATEGY", entity: "Strategy", entityId: id } });
  return { success: true };
}

export async function deleteStrategy(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  try {
    await prisma.strategy.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_STRATEGY", entity: "Strategy", entityId: id } });
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete strategy with active allocations" };
  }
}

// ─── Investment Plans ────────────────────────────────────────────────────────

export async function getInvestmentPlans() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.investmentPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { investments: true } } },
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
  try {
    await prisma.investmentPlan.create({ data });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_INVESTMENT_PLAN", entity: "InvestmentPlan", details: data.name } });
    return { success: true };
  } catch {
    return { success: false, error: "Plan name already exists or invalid data" };
  }
}

export async function updateInvestmentPlan(
  id: string,
  data: Partial<{ name: string; description: string; minAmount: number; durationDays: number; roiPercent: number; isActive: boolean }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.investmentPlan.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_INVESTMENT_PLAN", entity: "InvestmentPlan", entityId: id } });
  return { success: true };
}

export async function deleteInvestmentPlan(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  try {
    await prisma.investmentPlan.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_INVESTMENT_PLAN", entity: "InvestmentPlan", entityId: id } });
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete plan with existing investments" };
  }
}

// ─── Wallet Management ───────────────────────────────────────────────────────

export async function getAdminWallets({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.wallet.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, isSuspended: true, role: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, type: true, amount: true, status: true, createdAt: true } },
    },
    orderBy: { balance: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function adminCreditWallet(userId: string, amount: number, description: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { success: false, error: "Wallet not found" };

  await prisma.$transaction([
    prisma.wallet.update({ where: { userId }, data: { balance: { increment: amount } } }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "ADJUSTMENT",
        amount,
        status: "APPROVED",
        description: description || "Admin credit",
        approvedBy: session.userId,
        approvedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: { userId: session.userId, action: "ADMIN_CREDIT_WALLET", entity: "Wallet", entityId: wallet.id, details: `$${amount} — ${description}` },
    }),
  ]);

  await createNotification(userId, "WALLET_CREDIT", "Wallet Credited", `Your wallet has been credited $${amount}. ${description}`);
  return { success: true };
}

export async function adminDebitWallet(userId: string, amount: number, description: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { success: false, error: "Wallet not found" };
  if (wallet.balance < amount) return { success: false, error: "Insufficient wallet balance" };

  await prisma.$transaction([
    prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "ADJUSTMENT",
        amount: -amount,
        status: "APPROVED",
        description: description || "Admin debit",
        approvedBy: session.userId,
        approvedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: { userId: session.userId, action: "ADMIN_DEBIT_WALLET", entity: "Wallet", entityId: wallet.id, details: `$${amount} — ${description}` },
    }),
  ]);

  return { success: true };
}

export async function adminFreezeUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: true } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "FREEZE_ACCOUNT", entity: "User", entityId: userId } });
  return { success: true };
}

export async function adminUnfreezeUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: false } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UNFREEZE_ACCOUNT", entity: "User", entityId: userId } });
  return { success: true };
}

// ─── Content Management ──────────────────────────────────────────────────────

export async function getContents({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.content.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true } } },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function createContent(data: {
  title: string;
  description?: string;
  type: ContentType;
  url: string;
  thumbnailUrl?: string;
  membershipRequired?: boolean;
  planId?: string;
  duration?: number;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.content.create({ data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_CONTENT", entity: "Content", details: data.title } });
  return { success: true };
}

export async function updateContent(
  id: string,
  data: Partial<{ title: string; description: string; type: ContentType; url: string; thumbnailUrl: string; membershipRequired: boolean; planId: string | null; duration: number; isPublished: boolean }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.content.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_CONTENT", entity: "Content", entityId: id } });
  return { success: true };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.content.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_CONTENT", entity: "Content", entityId: id } });
  return { success: true };
}

// ─── Live Sessions ───────────────────────────────────────────────────────────

export async function getLiveSessions({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.liveSession.findMany({
    orderBy: { scheduledAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function createLiveSession(data: {
  title: string;
  description?: string;
  scheduledAt: Date;
  streamUrl?: string;
  membersOnly?: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.liveSession.create({ data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_LIVE_SESSION", entity: "LiveSession", details: data.title } });
  return { success: true };
}

export async function updateLiveSession(
  id: string,
  data: Partial<{ title: string; description: string; scheduledAt: Date; streamUrl: string | null; replayUrl: string | null; isLive: boolean; endedAt: Date | null; membersOnly: boolean }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.liveSession.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_LIVE_SESSION", entity: "LiveSession", entityId: id } });
  return { success: true };
}

export async function deleteLiveSession(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.liveSession.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_LIVE_SESSION", entity: "LiveSession", entityId: id } });
  return { success: true };
}

// ─── Community Management ────────────────────────────────────────────────────

export async function getCommunities() {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true } } },
  });
}

export async function createCommunity(data: {
  name: string;
  type: CommunityType;
  url: string;
  planId?: string;
  tier?: StrategyTier;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.community.create({ data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "CREATE_COMMUNITY", entity: "Community", details: data.name } });
  return { success: true };
}

export async function updateCommunity(
  id: string,
  data: Partial<{ name: string; type: CommunityType; url: string; planId: string | null; tier: StrategyTier | null; isActive: boolean }>
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.community.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "UPDATE_COMMUNITY", entity: "Community", entityId: id } });
  return { success: true };
}

export async function deleteCommunity(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  await prisma.community.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "DELETE_COMMUNITY", entity: "Community", entityId: id } });
  return { success: true };
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function broadcastNotification(
  title: string,
  message: string,
  targetUserIds?: string[]
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Insufficient permissions" };
  if (!title.trim() || !message.trim()) return { success: false, error: "Title and message are required" };

  let userIds = targetUserIds;
  if (!userIds || userIds.length === 0) {
    const users = await prisma.user.findMany({ select: { id: true } });
    userIds = users.map((u) => u.id);
  }

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: "GENERAL" as const, title, message })),
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: "BROADCAST_NOTIFICATION", entity: "Notification", details: `"${title}" → ${userIds.length} users` },
  });

  return { success: true };
}

export async function getRecentNotifications({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const session = await requireAdmin();
  if (!session) return [];
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
    skip: (page - 1) * limit,
    take: limit,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalyticsData() {
  const session = await requireAdmin();
  if (!session) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    recentUsers,
    prevUsers,
    recentDeposits,
    prevDeposits,
    recentWithdrawals,
    topPlans,
    usersByRole,
    recentInvestments,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "APPROVED", createdAt: { gte: thirtyDaysAgo } }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "APPROVED", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { type: "WITHDRAWAL", status: "APPROVED", createdAt: { gte: thirtyDaysAgo } }, select: { amount: true } }),
    prisma.membership.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { name: true, price: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ select: { role: true } }),
    prisma.userInvestment.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { amount: true } }),
  ]);

  const planCounts = topPlans.reduce<Record<string, { count: number; revenue: number; name: string }>>((acc, m) => {
    const name = m.plan.name;
    if (!acc[name]) acc[name] = { count: 0, revenue: 0, name };
    acc[name].count += 1;
    acc[name].revenue += m.plan.price;
    return acc;
  }, {});

  const roleCounts = usersByRole.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const recentRevenue = recentDeposits.reduce((s, t) => s + t.amount, 0);
  const prevRevenue = prevDeposits.reduce((s, t) => s + t.amount, 0);
  const recentWithdrawalTotal = recentWithdrawals.reduce((s, t) => s + t.amount, 0);
  const recentInvestmentTotal = recentInvestments.reduce((s, t) => s + t.amount, 0);

  return {
    recentUsers,
    prevUsers,
    userGrowthPct: prevUsers > 0 ? Math.round(((recentUsers - prevUsers) / prevUsers) * 100) : 0,
    recentRevenue,
    prevRevenue,
    revenueGrowthPct: prevRevenue > 0 ? Math.round(((recentRevenue - prevRevenue) / prevRevenue) * 100) : 0,
    recentWithdrawalTotal,
    recentInvestmentTotal,
    topPlans: Object.values(planCounts).sort((a, b) => b.count - a.count).slice(0, 5),
    roleCounts,
    depositCount: recentDeposits.length,
    withdrawalCount: recentWithdrawals.length,
  };
}
