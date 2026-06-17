import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    content: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    membership: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getContent, getContentItem, createContent, togglePublish } from "@/lib/actions/content";

const mockSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };
const adminSession = { userId: "admin1", email: "admin@b.com", role: "ADMIN" as const, name: "Admin" };

describe("getContent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns public content for unauthenticated users", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(prisma.content.findMany).mockResolvedValue([
      { id: "c1", title: "Intro Video", membershipRequired: false, isPublished: true },
    ] as any);

    const result = await getContent();
    expect(result).toHaveLength(1);
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isPublished: true }) })
    );
  });

  it("returns all published content for members with active membership", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({ id: "m1", status: "ACTIVE" } as any);
    vi.mocked(prisma.content.findMany).mockResolvedValue([
      { id: "c1", membershipRequired: false },
      { id: "c2", membershipRequired: true },
    ] as any);

    const result = await getContent();
    expect(result).toHaveLength(2);
  });
});

describe("getContentItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns content item for valid id", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({ id: "m1", status: "ACTIVE" } as any);
    vi.mocked(prisma.content.findUnique).mockResolvedValue({
      id: "c1", title: "Lesson 1", membershipRequired: true, isPublished: true,
    } as any);

    const result = await getContentItem("c1");
    expect(result?.id).toBe("c1");
  });

  it("returns null for locked content without membership", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.content.findUnique).mockResolvedValue({
      id: "c1", membershipRequired: true, isPublished: true,
    } as any);

    const result = await getContentItem("c1");
    expect(result).toBeNull();
  });
});

describe("createContent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admins to create content", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.content.create).mockResolvedValue({ id: "c1" } as any);

    const result = await createContent({
      title: "New Video",
      type: "VIDEO",
      url: "https://example.com/video",
      membershipRequired: false,
    });
    expect(result.success).toBe(true);
    expect(prisma.content.create).toHaveBeenCalledOnce();
  });

  it("rejects non-admins from creating content", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);

    const result = await createContent({
      title: "New Video",
      type: "VIDEO",
      url: "https://example.com/video",
      membershipRequired: false,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/permission/i);
  });
});

describe("togglePublish", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admins to toggle publish state", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.content.update).mockResolvedValue({ id: "c1", isPublished: false } as any);

    const result = await togglePublish("c1", false);
    expect(result.success).toBe(true);
    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isPublished: false } })
    );
  });

  it("rejects non-admins", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession);
    const result = await togglePublish("c1", false);
    expect(result.success).toBe(false);
  });
});
