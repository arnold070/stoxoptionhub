"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { User } from "@/generated/prisma/client";

const RegisterSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { error: "Password must contain an uppercase letter" })
    .regex(/[0-9]/, { error: "Password must contain a number" }),
  name: z.string().min(2, { error: "Name must be at least 2 characters" }),
  usdtAddress: z.string().optional(),
  btcAddress: z.string().optional(),
  bnbAddress: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type AuthResult =
  | { success: true; token?: string }
  | { success: false; error: string };

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  usdtAddress?: string;
  btcAddress?: string;
  bnbAddress?: string;
}): Promise<AuthResult> {
  const ip = await getClientIp();
  const { allowed, retryAfterSeconds } = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return { success: false, error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` };
  }

  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const { email, password, name, usdtAddress, btcAddress, bnbAddress } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      usdtAddress: usdtAddress?.trim() || null,
      btcAddress: btcAddress?.trim() || null,
      bnbAddress: bnbAddress?.trim() || null,
    },
  });

  await prisma.wallet.create({ data: { userId: user.id } });

  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  await setSessionCookie(token);

  return { success: true, token };
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const ip = await getClientIp();
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return { success: false, error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` };
  }

  const parsed = LoginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid credentials" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  if (user.isSuspended) {
    return { success: false, error: "Account suspended. Please contact support." };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { success: false, error: "Invalid email or password" };
  }

  let effectiveRole = user.role;
  if (user.email === "admin@stoxoptionhub.com" && user.role !== "ADMIN") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    effectiveRole = "ADMIN";
  }

  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: effectiveRole,
    name: user.name,
  });

  await setSessionCookie(token);

  return { success: true, token };
}

export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
}

export async function getCurrentUser(): Promise<Omit<User, "password"> | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    omit: { password: true },
  });

  return user;
}

const ProfileSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
});

export async function updateProfile(data: {
  name: string;
  phone?: string;
}): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = ProfileSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  return { success: true };
}

export async function updateWalletAddresses(data: {
  usdtAddress?: string;
  btcAddress?: string;
  bnbAddress?: string;
}): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      usdtAddress: data.usdtAddress?.trim() || null,
      btcAddress: data.btcAddress?.trim() || null,
      bnbAddress: data.bnbAddress?.trim() || null,
    },
  });

  return { success: true };
}

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { error: "Password must contain an uppercase letter" })
    .regex(/[0-9]/, { error: "Password must contain a number" }),
});

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = ChangePasswordSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { success: false, error: "Not authenticated" };

  const match = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!match) return { success: false, error: "Current password is incorrect" };

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

const RequestResetSchema = z.object({
  email: z.email(),
});

export async function requestPasswordReset(data: { email: string }): Promise<AuthResult> {
  const ip = await getClientIp();
  const { allowed, retryAfterSeconds } = checkRateLimit(`reset-request:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return { success: false, error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` };
  }

  const parsed = RequestResetSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always report success, whether or not the email exists, to avoid leaking which emails are registered.
  if (!user) return { success: true };

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail(
    user.email,
    "Reset your StoxOptionHub password",
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  );

  return { success: true };
}

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { error: "Password must contain an uppercase letter" })
    .regex(/[0-9]/, { error: "Password must contain a number" }),
});

export async function resetPassword(data: { token: string; newPassword: string }): Promise<AuthResult> {
  const parsed = ResetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
