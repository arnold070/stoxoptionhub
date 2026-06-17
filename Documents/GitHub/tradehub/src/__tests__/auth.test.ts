import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    wallet: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock next/headers cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

import { prisma } from "@/lib/prisma";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "@/lib/actions/auth";
import { createSession, verifyToken } from "@/lib/auth";

describe("createSession / verifyToken", () => {
  it("creates a valid JWT and verifies it", async () => {
    const payload = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };
    const token = await createSession(payload);
    expect(typeof token).toBe("string");
    const decoded = await verifyToken(token);
    expect(decoded?.userId).toBe("u1");
    expect(decoded?.email).toBe("a@b.com");
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("not.a.jwt");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const payload = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };
    const token = await createSession(payload);
    const result = await verifyToken(token + "tampered");
    expect(result).toBeNull();
  });
});

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user with hashed password", async () => {
    vi.spyOn(bcrypt, "hash").mockImplementation(async (data: string | Buffer, salt: string | number) =>
      bcrypt.hashSync(data as string, 4)
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test User",
      role: "MEMBER",
      emailVerified: false,
      isSuspended: false,
      avatarUrl: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "hashed",
    } as any);
    vi.mocked(prisma.wallet.create).mockResolvedValue({ id: "w1" } as any);

    const result = await registerUser({
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledOnce();
    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0] as any;
    expect(createArgs.data.email).toBe("test@example.com");
    expect(createArgs.data.password).not.toBe("Password123!");
    expect(await bcrypt.compare("Password123!", createArgs.data.password)).toBe(true);
  });

  it("rejects if email already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as any);

    const result = await registerUser({
      email: "existing@example.com",
      password: "Password123!",
      name: "Existing User",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/already/i);
  });

  it("rejects weak passwords", async () => {
    const result = await registerUser({
      email: "new@example.com",
      password: "weak",
      name: "Test",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/password/i);
  });

  it("rejects invalid email format", async () => {
    const result = await registerUser({
      email: "not-an-email",
      password: "Password123!",
      name: "Test",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/email/i);
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a token for valid credentials", async () => {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      role: "MEMBER",
      password: hashedPassword,
      isSuspended: false,
      emailVerified: true,
    } as any);

    const result = await loginUser({ email: "test@example.com", password: "Password123!" });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.token).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      role: "MEMBER",
      password: hashedPassword,
      isSuspended: false,
    } as any);

    const result = await loginUser({ email: "test@example.com", password: "WrongPass!" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/invalid/i);
  });

  it("rejects non-existent user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await loginUser({ email: "nobody@example.com", password: "Password123!" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/invalid/i);
  });

  it("rejects suspended user", async () => {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "banned@example.com",
      name: "Banned",
      role: "MEMBER",
      password: hashedPassword,
      isSuspended: true,
    } as any);

    const result = await loginUser({ email: "banned@example.com", password: "Password123!" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toMatch(/suspended/i);
  });
});

describe("logoutUser", () => {
  it("clears the session cookie", async () => {
    await logoutUser();
    expect(mockCookies.delete).toHaveBeenCalledWith("stoxoptionhub_session");
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie", async () => {
    mockCookies.get.mockReturnValue(undefined);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns user data for a valid session", async () => {
    const payload = { userId: "u1", email: "a@b.com", role: "MEMBER" as const, name: "Alice" };
    const token = await createSession(payload);
    mockCookies.get.mockReturnValue({ value: token });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      name: "Alice",
      role: "MEMBER",
      emailVerified: true,
      isSuspended: false,
      avatarUrl: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const user = await getCurrentUser();
    expect(user?.id).toBe("u1");
    expect(user?.email).toBe("a@b.com");
  });
});
