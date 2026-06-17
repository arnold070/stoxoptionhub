"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification, sendEmailNotification } from "@/lib/notifications";
import type { Role, TransactionStatus, TransactionType } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function getUsers() {
  const session = await requireAdmin();
  if (!session) return [];

  return prisma.user.findMany({
    omit: { password: true },
    include: {
      memberships: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
      wallet: { select: { balance: true } },
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
    include: { user: { select: { name: true, email: true } } },
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
    // WITHDRAWAL: balance was already reserved (decremented) when the request was created

    return deposit;
  });

  if (!result) return { success: false, error: "Transaction already processed or not found" };

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "APPROVE_TRANSACTION",
      entity: "Transaction",
      entityId: transactionId,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true } });
  if (user) {
    await createNotification(
      result.userId,
      result.type === "DEPOSIT" ? "DEPOSIT_APPROVED" : "WALLET_CREDIT",
      result.type === "DEPOSIT" ? "Deposit Approved" : "Transaction Approved",
      `Your ${result.type.toLowerCase()} of $${result.amount} has been approved and your wallet has been updated.`
    );
    await sendEmailNotification(
      user.email,
      `${result.type === "DEPOSIT" ? "Deposit" : "Transaction"} Approved — StoxOptionHub`,
      `<p>Hi ${user.name},</p><p>Your ${result.type.toLowerCase()} of <strong>$${result.amount}</strong> has been approved. Your wallet balance has been updated.</p><p>Log in to your dashboard to view the update.</p>`
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
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        adminNote: reason ?? null,
      },
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
    data: {
      userId: session.userId,
      action: "REJECT_TRANSACTION",
      entity: "Transaction",
      entityId: transactionId,
      details: reason,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true } });
  if (user) {
    const isWithdrawal = result.type === "WITHDRAWAL";
    await createNotification(
      result.userId,
      "DEPOSIT_REJECTED",
      isWithdrawal ? "Withdrawal Rejected" : "Deposit Rejected",
      `Your ${isWithdrawal ? "withdrawal" : "deposit"} of $${result.amount} was rejected.${reason ? ` Reason: ${reason}` : ""}${isWithdrawal ? " Your funds have been returned to your wallet." : ""}`
    );
    await sendEmailNotification(
      user.email,
      `${isWithdrawal ? "Withdrawal" : "Deposit"} Rejected — StoxOptionHub`,
      `<p>Hi ${user.name},</p><p>Your ${isWithdrawal ? "withdrawal" : "deposit"} of <strong>$${result.amount}</strong> could not be approved.${reason ? `<br/>Reason: ${reason}` : ""}${isWithdrawal ? "<br/>Your funds have been returned to your wallet balance." : ""}</p><p>Please contact support if you believe this is an error.</p>`
    );
  }

  return { success: true };
}

export async function getPlatformStats() {
  const session = await requireAdmin();
  if (!session) return null;

  const [totalUsers, activeMembers, pendingTxCount] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }).then((u) => u.length),
    prisma.membership.findMany({ where: { status: "ACTIVE" }, select: { id: true } }).then((m) => m.length),
    prisma.transaction.findMany({ where: { status: "PENDING" }, select: { id: true } }).then((t) => t.length),
  ]);

  return { totalUsers, activeMembers, pendingTxCount };
}
