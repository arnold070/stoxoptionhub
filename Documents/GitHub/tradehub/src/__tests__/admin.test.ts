import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    membership: { findMany: vi.fn(), update: vi.fn() },
    transaction: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    wallet: { update: vi.fn() },
    strategy: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    plan: { create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (cb: any) => cb({
      transaction: { updateMany: vi.fn(), findUnique: vi.fn() },
      wallet: { update: vi.fn() },
    })),
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
  sendEmailNotification: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  getUsers,
  suspendUser,
  unsuspendUser,
  approveTransaction,
  rejectTransaction,
  getPendingTransactions,
  getPlatformStats,
  updateUserRole,
} from "@/lib/actions/admin";

const adminSession = { userId: "admin1", email: "admin@b.com", role: "ADMIN" as const, name: "Admin" };
const memberSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getUsers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all users for admins", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", email: "a@b.com", role: "MEMBER" },
      { id: "u2", email: "b@b.com", role: "MEMBER" },
    ] as any);

    const result = await getUsers();
    expect(result).toHaveLength(2);
  });

  it("rejects non-admins", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await getUsers();
    expect(result).toEqual([]);
  });
});

describe("suspendUser / unsuspendUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("suspends a user", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1", isSuspended: true } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);

    const result = await suspendUser("u1");
    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isSuspended: true } })
    );
  });

  it("unsuspends a user", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1", isSuspended: false } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);

    const result = await unsuspendUser("u1");
    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isSuspended: false } })
    );
  });

  it("prevents non-admin from suspending", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await suspendUser("u1");
    expect(result.success).toBe(false);
    expect((result as any).error).toMatch(/permission/i);
  });
});

describe("approveTransaction (atomic + idempotent)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("approves a deposit and credits wallet via $transaction", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    const txRecord = { id: "t1", type: "DEPOSIT", amount: 500, walletId: "w1", userId: "u1", status: "APPROVED" };
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "w1", balance: 500 });
    const txUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txFindUnique = vi.fn().mockResolvedValue(txRecord);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({ transaction: { updateMany: txUpdateMany, findUnique: txFindUnique }, wallet: { update: txWalletUpdate } })
    );
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.com", name: "Alice" } as any);

    const result = await approveTransaction("t1");
    expect(result.success).toBe(true);
    expect(txUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "t1", status: "PENDING" }) })
    );
    expect(txWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { increment: 500 } } })
    );
  });

  it("returns error when already processed (count === 0, idempotency)", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    const txUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({ transaction: { updateMany: txUpdateMany, findUnique: vi.fn() }, wallet: { update: vi.fn() } })
    );

    const result = await approveTransaction("t1");
    expect(result.success).toBe(false);
    expect((result as any).error).toMatch(/already processed/i);
  });

  it("rejects non-admin", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await approveTransaction("t1");
    expect(result.success).toBe(false);
    expect((result as any).error).toMatch(/permission/i);
  });
});

describe("rejectTransaction (atomic + idempotent)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a pending deposit", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    const txRecord = { id: "t1", type: "DEPOSIT", amount: 500, walletId: "w1", userId: "u1", status: "REJECTED" };
    const txUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txFindUnique = vi.fn().mockResolvedValue(txRecord);
    const txWalletUpdate = vi.fn().mockResolvedValue({});

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({ transaction: { updateMany: txUpdateMany, findUnique: txFindUnique }, wallet: { update: txWalletUpdate } })
    );
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.com", name: "Alice" } as any);

    const result = await rejectTransaction("t1", "Unverified TXID");
    expect(result.success).toBe(true);
    expect(txUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "t1", status: "PENDING" }),
        data: expect.objectContaining({ status: "REJECTED", adminNote: "Unverified TXID" }),
      })
    );
    expect(txWalletUpdate).not.toHaveBeenCalled();
  });

  it("restores reserved balance when rejecting a WITHDRAWAL", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    const txRecord = { id: "t2", type: "WITHDRAWAL", amount: 300, walletId: "w1", userId: "u1", status: "REJECTED" };
    const txUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txFindUnique = vi.fn().mockResolvedValue(txRecord);
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "w1", balance: 1300 });

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({ transaction: { updateMany: txUpdateMany, findUnique: txFindUnique }, wallet: { update: txWalletUpdate } })
    );
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.com", name: "Alice" } as any);

    const result = await rejectTransaction("t2", "Invalid address");
    expect(result.success).toBe(true);
    expect(txWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { increment: 300 } } })
    );
  });

  it("returns error when already processed (idempotency)", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({ transaction: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), findUnique: vi.fn() }, wallet: { update: vi.fn() } })
    );

    const result = await rejectTransaction("t1");
    expect(result.success).toBe(false);
  });
});

describe("updateUserRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates user role", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "u1", role: "MENTOR" } as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: "al1" } as any);

    const result = await updateUserRole("u1", "MENTOR");
    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "MENTOR" } })
    );
  });
});

describe("getPendingTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns pending transactions for admin", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { id: "t1", type: "DEPOSIT", amount: 500, status: "PENDING" },
    ] as any);

    const result = await getPendingTransactions();
    expect(result).toHaveLength(1);
  });

  it("returns empty array for non-admin", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await getPendingTransactions();
    expect(result).toEqual([]);
  });
});

describe("getPlatformStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stats for admin", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{}, {}] as any);
    vi.mocked(prisma.membership.findMany).mockResolvedValue([{}] as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([{}, {}] as any);

    const result = await getPlatformStats();
    expect(result?.totalUsers).toBe(2);
    expect(result?.activeMembers).toBe(1);
    expect(result?.pendingTxCount).toBe(2);
  });

  it("returns null for non-admin", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await getPlatformStats();
    expect(result).toBeNull();
  });
});
