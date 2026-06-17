"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { ContentType } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function getContent() {
  const session = await getSession();

  let hasMembership = false;
  if (session) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
    });
    hasMembership = !!membership;
  }

  return prisma.content.findMany({
    where: {
      isPublished: true,
      ...(hasMembership ? {} : { membershipRequired: false }),
    },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContentItem(id: string) {
  const session = await getSession();
  const item = await prisma.content.findUnique({ where: { id } });
  if (!item || !item.isPublished) return null;

  if (item.membershipRequired) {
    if (!session) return null;
    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
    });
    if (!membership) return null;
  }

  return item;
}

export async function createContent(data: {
  title: string;
  type: ContentType;
  url: string;
  description?: string;
  membershipRequired: boolean;
  planId?: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MENTOR")) {
    return { success: false, error: "Insufficient permissions" };
  }

  await prisma.content.create({
    data: { ...data, isPublished: true },
  });

  return { success: true };
}

export async function togglePublish(id: string, published: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MENTOR")) {
    return { success: false, error: "Insufficient permissions" };
  }

  await prisma.content.update({
    where: { id },
    data: { isPublished: published },
  });

  return { success: true };
}
