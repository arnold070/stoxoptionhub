import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    community: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    membership: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCommunityLinks, addCommunityLink, toggleCommunityLink } from "@/lib/actions/community";

const adminSession = { userId: "admin1", email: "admin@b.com", role: "ADMIN" as const, name: "Admin" };
const memberSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getCommunityLinks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns accessible community links for active members", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({
      id: "m1", planId: "p1", status: "ACTIVE",
    } as any);
    vi.mocked(prisma.community.findMany).mockResolvedValue([
      { id: "c1", name: "Main Telegram", type: "TELEGRAM", url: "https://t.me/stoxoptionhub", planId: "p1" },
    ] as any);

    const result = await getCommunityLinks();
    expect(result).toHaveLength(1);
  });

  it("returns empty array for unauthenticated users", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await getCommunityLinks();
    expect(result).toEqual([]);
  });

  it("returns empty array for users without membership", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);

    const result = await getCommunityLinks();
    expect(result).toEqual([]);
  });
});

describe("addCommunityLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admins to add community links", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.community.create).mockResolvedValue({ id: "c1" } as any);

    const result = await addCommunityLink({
      name: "VIP Telegram",
      type: "TELEGRAM",
      url: "https://t.me/stoxoptionhub_vip",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admins", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);

    const result = await addCommunityLink({
      name: "Test",
      type: "TELEGRAM",
      url: "https://t.me/test",
      isActive: true,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/permission/i);
  });
});

describe("toggleCommunityLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toggles a community link active state", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.community.create).mockResolvedValue({ id: "c1" } as any);

    const result = await toggleCommunityLink("c1", false);
    expect(result.success).toBe(true);
  });

  it("rejects non-admins from toggling", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    const result = await toggleCommunityLink("c1", false);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/permission/i);
  });
});
