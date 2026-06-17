"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function getLiveSessions() {
  const session = await getSession();

  let hasMembership = false;
  if (session) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
    });
    hasMembership = !!membership;
  }

  return prisma.liveSession.findMany({
    where: hasMembership ? undefined : { membersOnly: false },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getLiveSession(id: string) {
  return prisma.liveSession.findUnique({ where: { id } });
}

export async function createLiveSession(data: {
  title: string;
  description?: string;
  scheduledAt: Date;
  streamUrl?: string;
  membersOnly: boolean;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  if (data.scheduledAt <= new Date()) {
    return { success: false, error: "Session must be scheduled in the future" };
  }

  await prisma.liveSession.create({ data });
  return { success: true };
}

export async function startSession(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  const liveSession = await prisma.liveSession.findUnique({ where: { id } });
  if (!liveSession) return { success: false, error: "Session not found" };

  await prisma.liveSession.update({
    where: { id },
    data: { isLive: true },
  });

  return { success: true };
}

export async function endSession(id: string, replayUrl?: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  const liveSession = await prisma.liveSession.findUnique({ where: { id } });
  if (!liveSession) return { success: false, error: "Session not found" };

  await prisma.liveSession.update({
    where: { id },
    data: { isLive: false, endedAt: new Date(), ...(replayUrl ? { replayUrl } : {}) },
  });

  return { success: true };
}
