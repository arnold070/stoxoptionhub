import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    investmentPlan: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    userInvestment: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(async (cb: any) => cb({
      investmentPlan: { findUnique: vi.fn() },
      userInvestment: { updateMany: vi.fn(), create: vi.fn() },
      wallet: { findUnique: vi.fn(), update: vi.fn() },
      transaction: { create: vi.fn() },
    })),
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
  sendEmailNotification: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(async () => "127.0.0.1"),
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterSeconds: 0 })),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import {
  getInvestmentPlans,
  getMyInvestments,
  purchaseInvestment,
  processMaturities,
} from "@/lib/actions/investments";

const memberSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

const mockPlan = {
  id: "plan1",
  name: "Alpha Momentum",
  description: "Momentum strategy",
  minAmount: 100,
  durationDays: 30,
  roiPercent: 8,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getInvestmentPlans", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active plans", async () => {
    vi.mocked(prisma.investmentPlan.findMany).mockResolvedValue([mockPlan] as any);
    const result = await getInvestmentPlans();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alpha Momentum");
  });
});

describe("getMyInvestments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns investments for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.userInvestment.findMany).mockResolvedValue([
      { id: "inv1", userId: "u1", planId: "plan1", amount: 200, status: "ACTIVE", plan: mockPlan },
    ] as any);

    const result = await getMyInvestments();
    expect(result).toHaveLength(1);
  });

  it("returns empty array when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await getMyInvestments();
    expect(result).toEqual([]);
  });
});

describe("purchaseInvestment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deducts balance and creates investment via $transaction", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.investmentPlan.findUnique).mockResolvedValue(mockPlan as any);
    vi.mocked(createNotification).mockResolvedValue(undefined as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "a@b.com", name: "Alice" } as any);

    const txWalletFindUnique = vi.fn().mockResolvedValue({ id: "w1", balance: 500 });
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "w1", balance: 300 });
    const txInvestmentCreate = vi.fn().mockResolvedValue({ id: "inv1" });
    const txTransactionCreate = vi.fn().mockResolvedValue({ id: "txn1" });

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        wallet: { findUnique: txWalletFindUnique, update: txWalletUpdate },
        userInvestment: { create: txInvestmentCreate, updateMany: vi.fn() },
        transaction: { create: txTransactionCreate },
      })
    );

    const result = await purchaseInvestment({ planId: "plan1", amount: 200 });
    expect(result.success).toBe(true);
    expect(txWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { decrement: 200 } } })
    );
    expect(txInvestmentCreate).toHaveBeenCalled();
  });

  it("rejects when balance insufficient", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.investmentPlan.findUnique).mockResolvedValue(mockPlan as any);

    const txWalletFindUnique = vi.fn().mockResolvedValue({ id: "w1", balance: 50 });
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        wallet: { findUnique: txWalletFindUnique, update: vi.fn() },
        userInvestment: { create: vi.fn(), updateMany: vi.fn() },
        transaction: { create: vi.fn() },
      })
    );

    const result = await purchaseInvestment({ planId: "plan1", amount: 200 });
    expect(result.success).toBe(false);
    expect((result as any).error).toMatch(/insufficient/i);
  });

  it("rejects below plan minimum", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.investmentPlan.findUnique).mockResolvedValue(mockPlan as any);

    const result = await purchaseInvestment({ planId: "plan1", amount: 10 });
    expect(result.success).toBe(false);
    expect((result as any).error).toMatch(/minimum/i);
  });

  it("rejects when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await purchaseInvestment({ planId: "plan1", amount: 200 });
    expect(result.success).toBe(false);
  });
});

describe("processMaturities (idempotency)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("processes mature investments and skips already-completed ones", async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 1000);

    const inv = {
      id: "inv1",
      userId: "u1",
      planId: "plan1",
      amount: 100,
      expectedPayout: 108,
      status: "ACTIVE",
      endDate: pastDate,
      plan: { name: "Alpha Momentum" },
      user: { email: "a@b.com", name: "Alice" },
    };

    vi.mocked(prisma.userInvestment.findMany).mockResolvedValue([inv] as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 0 } as any);
    vi.mocked(createNotification).mockResolvedValue(undefined as any);

    const txUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "w1", balance: 108 });
    const txTxCreate = vi.fn().mockResolvedValue({ id: "txn1" });

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        userInvestment: { updateMany: txUpdateMany, create: vi.fn() },
        wallet: { update: txWalletUpdate },
        transaction: { create: txTxCreate },
      })
    );

    const result = await processMaturities();
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(txUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "inv1", status: "ACTIVE" }),
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
    expect(txWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { increment: 108 } } })
    );
  });

  it("skips already-completed investments (count === 0 idempotency)", async () => {
    const pastDate = new Date(Date.now() - 1000);
    const inv = {
      id: "inv1",
      userId: "u1",
      amount: 100,
      expectedPayout: 108,
      status: "ACTIVE",
      endDate: pastDate,
      plan: { name: "Alpha Momentum" },
      user: { email: "a@b.com", name: "Alice" },
    };

    vi.mocked(prisma.userInvestment.findMany).mockResolvedValue([inv] as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 0 } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        userInvestment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), create: vi.fn() },
        wallet: { update: vi.fn() },
        transaction: { create: vi.fn() },
      })
    );

    const result = await processMaturities();
    expect(result.processed).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("sends notification on successful maturity processing", async () => {
    const pastDate = new Date(Date.now() - 1000);
    const inv = {
      id: "inv1",
      userId: "u1",
      amount: 100,
      expectedPayout: 108,
      status: "ACTIVE",
      endDate: pastDate,
      plan: { name: "Alpha Momentum" },
      user: { email: "a@b.com", name: "Alice" },
    };

    vi.mocked(prisma.userInvestment.findMany).mockResolvedValue([inv] as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 0 } as any);
    vi.mocked(createNotification).mockResolvedValue(undefined as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        userInvestment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), create: vi.fn() },
        wallet: { update: vi.fn().mockResolvedValue({}) },
        transaction: { create: vi.fn().mockResolvedValue({}) },
      })
    );

    await processMaturities();

    expect(createNotification).toHaveBeenCalledWith(
      "u1",
      "INVESTMENT_MATURED",
      expect.any(String),
      expect.any(String)
    );
  });
});
