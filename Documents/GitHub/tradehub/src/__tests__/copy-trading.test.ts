import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    strategy: { findMany: vi.fn(), findUnique: vi.fn() },
    allocation: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  getStrategies,
  getUserAllocations,
  allocateToStrategy,
  withdrawFromStrategy,
} from "@/lib/actions/copy-trading";

const mockSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getStrategies", () => {
  it("returns active strategies", async () => {
    vi.mocked(prisma.strategy.findMany).mockResolvedValue([
      { id: "s1", name: "Alpha", tier: "GOLD", isActive: true },
    ] as any);

    const result = await getStrategies();
    expect(result).toHaveLength(1);
    expect(prisma.strategy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });
});

describe("getUserAllocations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allocations for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.allocation.findMany).mockResolvedValue([
      { id: "a1", userId: "u1", amount: 500, status: "ACTIVE" },
    ] as any);

    const result = await getUserAllocations();
    expect(result).toHaveLength(1);
  });

  it("returns empty array when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await getUserAllocations()).toEqual([]);
  });
});

describe("allocateToStrategy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an allocation and deducts from wallet", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.strategy.findUnique).mockResolvedValue({
      id: "s1", name: "Alpha", tier: "GOLD", minAmount: 100, maxAmount: 5000, isActive: true,
    } as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 1000 } as any);
    vi.mocked(prisma.allocation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.allocation.create).mockResolvedValue({ id: "a1" } as any);
    vi.mocked(prisma.wallet.update).mockResolvedValue({ id: "w1", balance: 500 } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "t1" } as any);

    const result = await allocateToStrategy({ strategyId: "s1", amount: 500 });
    expect(result.success).toBe(true);
    expect(prisma.allocation.create).toHaveBeenCalledOnce();
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { decrement: 500 } } })
    );
  });

  it("rejects amount below minimum", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.strategy.findUnique).mockResolvedValue({
      id: "s1", minAmount: 100, maxAmount: 5000, isActive: true,
    } as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 1000 } as any);
    vi.mocked(prisma.allocation.findFirst).mockResolvedValue(null);

    const result = await allocateToStrategy({ strategyId: "s1", amount: 50 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/minimum/i);
  });

  it("rejects when wallet balance is insufficient", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.strategy.findUnique).mockResolvedValue({
      id: "s1", minAmount: 100, maxAmount: 5000, isActive: true,
    } as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 50 } as any);
    vi.mocked(prisma.allocation.findFirst).mockResolvedValue(null);

    const result = await allocateToStrategy({ strategyId: "s1", amount: 200 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/insufficient/i);
  });

  it("rejects when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await allocateToStrategy({ strategyId: "s1", amount: 200 });
    expect(result.success).toBe(false);
  });
});

describe("withdrawFromStrategy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("withdraws allocation and credits wallet", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.allocation.findFirst).mockResolvedValue({
      id: "a1", userId: "u1", strategyId: "s1", amount: 500, status: "ACTIVE",
      strategy: { name: "Alpha" },
    } as any);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", balance: 100 } as any);
    vi.mocked(prisma.allocation.update).mockResolvedValue({ id: "a1", status: "WITHDRAWN" } as any);
    vi.mocked(prisma.wallet.update).mockResolvedValue({ id: "w1", balance: 600 } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "t1" } as any);

    const result = await withdrawFromStrategy({ allocationId: "a1" });
    expect(result.success).toBe(true);
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { increment: 500 } } })
    );
    expect(prisma.allocation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "WITHDRAWN" } })
    );
  });

  it("fails when allocation not found", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.allocation.findFirst).mockResolvedValue(null);

    const result = await withdrawFromStrategy({ allocationId: "a999" });
    expect(result.success).toBe(false);
  });
});
