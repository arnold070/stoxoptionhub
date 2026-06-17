"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { CommunityType, StrategyTier } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function getCommunityLinks() {
  const session = await getSession();
  if (!session) return [];

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, status: "ACTIVE" },
  });

  if (!membership) return [];

  return prisma.community.findMany({
    where: {
      isActive: true,
      OR: [
        { planId: membership.planId },
        { planId: null },
      ],
    },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addCommunityLink(data: {
  name: string;
  type: CommunityType;
  url: string;
  planId?: string;
  tier?: StrategyTier;
  isActive: boolean;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  await prisma.community.create({ data });
  return { success: true };
}

export async function toggleCommunityLink(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Insufficient permissions" };
  }

  await prisma.community.update({ where: { id }, data: { isActive } });
  return { success: true };
}
