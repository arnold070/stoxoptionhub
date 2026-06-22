import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findMany: vi.fn(), findUnique: vi.fn() },
    membership: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  getPlans,
  getUserMemberships,
  purchaseMembership,
  cancelMembership,
} from "@/lib/actions/memberships";

const mockSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getPlans", () => {
  it("returns active plans", async () => {
    const plans = [
      { id: "p1", name: "Basic", price: 50, isActive: true },
      { id: "p2", name: "Pro", price: 100, isActive: true },
    ];
    vi.mocked(prisma.plan.findMany).mockResolvedValue(plans as any);

    const result = await getPlans();
    expect(result).toHaveLength(2);
    expect(vi.mocked(prisma.plan.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });
});

describe("getUserMemberships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user memberships when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findMany).mockResolvedValue([
      { id: "m1", userId: "u1", planId: "p1", status: "ACTIVE" },
    ] as any);

    const result = await getUserMemberships();
    expect(result).toHaveLength(1);
  });

  it("returns empty array when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await getUserMemberships();
    expect(result).toEqual([]);
  });
});

describe("purchaseMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a membership and deducts from wallet", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.plan.findUnique).mockResolvedValue({
      id: "p1", name: "Basic", price: 50, isActive: true,
    } as any);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "u1", balance: 200,
    } as any);
    vi.mocked(prisma.membership.create).mockResolvedValue({ id: "m1" } as any);
    vi.mocked(prisma.wallet.update).mockResolvedValue({ id: "w1", balance: 150 } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "t1" } as any);

    const result = await purchaseMembership({ planId: "p1", hashCode: "TEST-CODE" });
    expect(result.success).toBe(true);
    expect(prisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { decrement: 50 } } })
    );
  });

  it("fails when wallet balance is insufficient", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.plan.findUnique).mockResolvedValue({
      id: "p1", name: "Basic", price: 200, isActive: true,
    } as any);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "u1", balance: 50,
    } as any);

    const result = await purchaseMembership({ planId: "p1", hashCode: "TEST-CODE" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/insufficient/i);
  });

  it("fails when user already has active membership for same plan", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.plan.findUnique).mockResolvedValue({
      id: "p1", name: "Basic", price: 50, isActive: true,
    } as any);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({
      id: "m1", status: "ACTIVE",
    } as any);

    const result = await purchaseMembership({ planId: "p1", hashCode: "TEST-CODE" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/already/i);
  });

  it("fails when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await purchaseMembership({ planId: "p1", hashCode: "TEST-CODE" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/authenticated/i);
  });
});

describe("cancelMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels an active membership", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({
      id: "m1", userId: "u1", status: "ACTIVE",
    } as any);
    vi.mocked(prisma.membership.update).mockResolvedValue({ id: "m1", status: "CANCELLED" } as any);

    const result = await cancelMembership({ membershipId: "m1" });
    expect(result.success).toBe(true);
    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CANCELLED" } })
    );
  });

  it("fails when membership not found or not owned by user", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);

    const result = await cancelMembership({ membershipId: "m999" });
    expect(result.success).toBe(false);
  });
});
