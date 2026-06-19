import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { findMany: vi.fn(), create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(async (cb: any) =>
      cb({
        wallet: { findUnique: vi.fn(), update: vi.fn() },
        transaction: { create: vi.fn() },
      })
    ),
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(async () => "127.0.0.1"),
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterSeconds: 0 })),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import {
  getWallet,
  getTransactionHistory,
  requestDeposit,
  requestWithdrawal,
} from "@/lib/actions/wallet";

const mockSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getWallet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns wallet for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "u1", balance: 1500, currency: "USDT",
    } as any);

    const result = await getWallet();
    expect(result?.balance).toBe(1500);
  });

  it("returns null when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await getWallet();
    expect(result).toBeNull();
  });
});

describe("getTransactionHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated transactions", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { id: "t1", type: "DEPOSIT", amount: 500, status: "COMPLETED", createdAt: new Date() },
      { id: "t2", type: "WITHDRAWAL", amount: 100, status: "PENDING", createdAt: new Date() },
    ] as any);

    const result = await getTransactionHistory();
    expect(result).toHaveLength(2);
  });
});

describe("requestDeposit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a pending deposit transaction with network and txHash", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: "w1", userId: "u1", balance: 0,
    } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "t1" } as any);
    vi.mocked(createNotification).mockResolvedValue(undefined as any);

    const result = await requestDeposit({ amount: 500, network: "TRC20", txHash: "abc123" });
    expect(result.success).toBe(true);
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "DEPOSIT",
          status: "PENDING",
          amount: 500,
          network: "TRC20",
          txHash: "abc123",
        }),
      })
    );
  });

  it("creates a DEPOSIT_SUBMITTED notification after deposit", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "u1", balance: 0 } as any);
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "t1" } as any);
    vi.mocked(createNotification).mockResolvedValue(undefined as any);

    await requestDeposit({ amount: 200, network: "ERC20", txHash: "def456" });

    expect(createNotification).toHaveBeenCalledWith(
      "u1",
      "DEPOSIT_SUBMITTED",
      expect.any(String),
      expect.any(String)
    );
  });

  it("rejects deposit below minimum", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const result = await requestDeposit({ amount: 1, network: "TRC20", txHash: "abc" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/minimum/i);
  });

  it("rejects when txHash is missing", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({ id: "w1", userId: "u1", balance: 0 } as any);

    const result = await requestDeposit({ amount: 100, network: "TRC20", txHash: "   " });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/hash/i);
  });

  it("rejects when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await requestDeposit({ amount: 500, network: "TRC20", txHash: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("requestWithdrawal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atomically reserves balance and creates PENDING withdrawal", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const txWalletFindUnique = vi.fn().mockResolvedValue({ id: "w1", userId: "u1", balance: 1000 });
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "w1", balance: 700 });
    const txTransactionCreate = vi.fn().mockResolvedValue({ id: "t1" });

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        wallet: { findUnique: txWalletFindUnique, update: txWalletUpdate },
        transaction: { create: txTransactionCreate },
      })
    );

    const result = await requestWithdrawal({ amount: 300, network: "ERC20", address: "0xABC123" });
    expect(result.success).toBe(true);
    expect(txWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: { decrement: 300 } } })
    );
    expect(txTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "WITHDRAWAL", status: "PENDING", amount: 300 }),
      })
    );
  });

  it("rejects withdrawal when balance insufficient (atomic check)", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) =>
      cb({
        wallet: { findUnique: vi.fn().mockResolvedValue({ id: "w1", balance: 50 }), update: vi.fn() },
        transaction: { create: vi.fn() },
      })
    );

    const result = await requestWithdrawal({ amount: 200, network: "ERC20", address: "0xABC123" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/insufficient/i);
  });

  it("rejects withdrawal below minimum", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const result = await requestWithdrawal({ amount: 5, network: "ERC20", address: "0xABC123" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/minimum/i);
  });
});
