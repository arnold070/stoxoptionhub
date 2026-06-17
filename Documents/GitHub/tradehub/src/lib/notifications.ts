import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  await prisma.notification.create({
    data: { userId, type, title, message },
  });
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] To: ${to} | Subject: ${subject}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "StoxOptionHub <noreply@stoxoptionhub.com>",
      to,
      subject,
      html,
    }),
  });
}
