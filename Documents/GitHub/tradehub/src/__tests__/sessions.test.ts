import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    liveSession: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    membership: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLiveSessions, getLiveSession, createLiveSession, startSession, endSession } from "@/lib/actions/sessions";


const adminSession = { userId: "admin1", email: "admin@b.com", role: "ADMIN" as const, name: "Admin" };
const memberSession = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };

describe("getLiveSessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns upcoming sessions for members with active membership", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue({ id: "m1" } as any);
    vi.mocked(prisma.liveSession.findMany).mockResolvedValue([
      { id: "ls1", title: "Trading Basics", membersOnly: true, scheduledAt: new Date() },
    ] as any);

    const result = await getLiveSessions();
    expect(result).toHaveLength(1);
  });

  it("filters membersOnly sessions for non-members", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.liveSession.findMany).mockResolvedValue([
      { id: "ls1", membersOnly: false, scheduledAt: new Date() },
    ] as any);

    await getLiveSessions();
    expect(prisma.liveSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ membersOnly: false }) })
    );
  });
});

describe("createLiveSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admins to create sessions", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.liveSession.create).mockResolvedValue({ id: "ls1" } as any);

    const result = await createLiveSession({
      title: "Trading Masterclass",
      scheduledAt: new Date(Date.now() + 86400000),
      membersOnly: true,
    });
    expect(result.success).toBe(true);
    expect(prisma.liveSession.create).toHaveBeenCalledOnce();
  });

  it("rejects sessions scheduled in the past", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);

    const result = await createLiveSession({
      title: "Old Session",
      scheduledAt: new Date(Date.now() - 1000),
      membersOnly: false,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/future/i);
  });

  it("rejects non-admins", async () => {
    vi.mocked(getSession).mockResolvedValue(memberSession);

    const result = await createLiveSession({
      title: "Test",
      scheduledAt: new Date(Date.now() + 86400000),
      membersOnly: false,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/permission/i);
  });
});

describe("getLiveSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a session by id", async () => {
    vi.mocked(prisma.liveSession.findUnique).mockResolvedValue({
      id: "ls1", title: "Test", isLive: false,
    } as any);

    const result = await getLiveSession("ls1");
    expect(result?.id).toBe("ls1");
  });

  it("returns null for non-existent session", async () => {
    vi.mocked(prisma.liveSession.findUnique).mockResolvedValue(null);
    const result = await getLiveSession("nope");
    expect(result).toBeNull();
  });
});

describe("startSession / endSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks session as live", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.liveSession.findUnique).mockResolvedValue({ id: "ls1", isLive: false } as any);
    vi.mocked(prisma.liveSession.update).mockResolvedValue({ id: "ls1", isLive: true } as any);

    const result = await startSession("ls1");
    expect(result.success).toBe(true);
    expect(prisma.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isLive: true }) })
    );
  });

  it("marks session as ended", async () => {
    vi.mocked(getSession).mockResolvedValue(adminSession);
    vi.mocked(prisma.liveSession.findUnique).mockResolvedValue({ id: "ls1", isLive: true } as any);
    vi.mocked(prisma.liveSession.update).mockResolvedValue({ id: "ls1", isLive: false } as any);

    const result = await endSession("ls1");
    expect(result.success).toBe(true);
    expect(prisma.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isLive: false }) })
    );
  });
});
