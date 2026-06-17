import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  // Plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: "Starter" },
      update: {},
      create: {
        name: "Starter",
        price: 49,
        duration: 30,
        description: "Perfect for beginners entering the markets",
        benefits: JSON.stringify([
          "Access to beginner content library",
          "Weekly group live sessions",
          "Community Telegram group",
          "Basic market analysis reports",
        ]),
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { name: "Pro Trader" },
      update: {},
      create: {
        name: "Pro Trader",
        price: 149,
        duration: 30,
        description: "For serious traders looking to level up",
        benefits: JSON.stringify([
          "Full content library access",
          "Daily live sessions & replays",
          "VIP Telegram + Discord groups",
          "1-on-1 monthly mentorship call",
          "Advanced strategy signals",
          "Priority support",
        ]),
        sortOrder: 2,
      },
    }),
    prisma.plan.upsert({
      where: { name: "Elite" },
      update: {},
      create: {
        name: "Elite",
        price: 349,
        duration: 30,
        description: "Exclusive access for our top-tier members",
        benefits: JSON.stringify([
          "Everything in Pro Trader",
          "Weekly 1-on-1 mentorship calls",
          "Private Elite Telegram channel",
          "Copy trading — all tiers",
          "Custom portfolio review",
          "Early access to new strategies",
          "Tax & compliance guidance",
        ]),
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✓ ${plans.length} plans`);

  // Investment Plans
  const investmentPlans = await Promise.all([
    prisma.investmentPlan.upsert({
      where: { name: "Starter Growth" },
      update: {},
      create: {
        name: "Starter Growth",
        description: "Entry-level plan with conservative risk profile. Suitable for first-time participants seeking exposure to structured strategies.",
        minAmount: 100,
        durationDays: 30,
        roiPercent: 6,
        isActive: true,
      },
    }),
    prisma.investmentPlan.upsert({
      where: { name: "Momentum 60" },
      update: {},
      create: {
        name: "Momentum 60",
        description: "60-day plan tracking momentum strategies across major crypto pairs. Balanced risk-reward profile.",
        minAmount: 500,
        durationDays: 60,
        roiPercent: 14,
        isActive: true,
      },
    }),
    prisma.investmentPlan.upsert({
      where: { name: "Alpha Compound" },
      update: {},
      create: {
        name: "Alpha Compound",
        description: "90-day compounding plan using trend-following and quantitative signals. Designed for patient capital with higher conviction.",
        minAmount: 1000,
        durationDays: 90,
        roiPercent: 22,
        isActive: true,
      },
    }),
    prisma.investmentPlan.upsert({
      where: { name: "Institutional Portfolio" },
      update: {},
      create: {
        name: "Institutional Portfolio",
        description: "180-day diversified plan across multiple strategy tiers. Reserved for serious participants with long investment horizons.",
        minAmount: 5000,
        durationDays: 180,
        roiPercent: 38,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ ${investmentPlans.length} investment plans`);

  // Strategies
  const strategies = await Promise.all([
    prisma.strategy.upsert({
      where: { name: "Alpha Scalper" },
      update: {},
      create: {
        name: "Alpha Scalper",
        description: "High-frequency scalping on BTC/ETH pairs. Targets 1-3% moves with tight stops.",
        tier: "BRONZE",
        minAmount: 100,
        maxAmount: 2000,
        performance: 18.4,
        managedBy: "StoxOptionHub Team",
      },
    }),
    prisma.strategy.upsert({
      where: { name: "Momentum Swing" },
      update: {},
      create: {
        name: "Momentum Swing",
        description: "Medium-term swing trades on altcoins. Holds positions 2-7 days for larger gains.",
        tier: "SILVER",
        minAmount: 250,
        maxAmount: 5000,
        performance: 34.7,
        managedBy: "StoxOptionHub Team",
      },
    }),
    prisma.strategy.upsert({
      where: { name: "Gold Trend Follower" },
      update: {},
      create: {
        name: "Gold Trend Follower",
        description: "Trend-following across top 20 coins. Low drawdown, consistent monthly returns.",
        tier: "GOLD",
        minAmount: 500,
        maxAmount: 10000,
        performance: 52.1,
        managedBy: "StoxOptionHub Team",
      },
    }),
    prisma.strategy.upsert({
      where: { name: "Platinum Quant" },
      update: {},
      create: {
        name: "Platinum Quant",
        description: "Quantitative algo strategy. Fully automated with risk-adjusted portfolio management.",
        tier: "PLATINUM",
        minAmount: 1000,
        maxAmount: null,
        performance: 89.3,
        managedBy: "StoxOptionHub Team",
      },
    }),
  ]);

  console.log(`✓ ${strategies.length} strategies`);

  // Content
  const content = await Promise.all([
    prisma.content.upsert({
      where: { id: "content-001" },
      update: {},
      create: {
        id: "content-001",
        title: "Introduction to Technical Analysis",
        description: "Learn the fundamentals of reading charts, candlestick patterns, and key indicators.",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: false,
        isPublished: true,
        duration: 45,
      },
    }),
    prisma.content.upsert({
      where: { id: "content-002" },
      update: {},
      create: {
        id: "content-002",
        title: "Risk Management Masterclass",
        description: "The #1 skill every profitable trader must master. Position sizing, stop-losses, and more.",
        type: "VIDEO",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: true,
        isPublished: true,
        duration: 62,
      },
    }),
    prisma.content.upsert({
      where: { id: "content-003" },
      update: {},
      create: {
        id: "content-003",
        title: "Advanced Fibonacci Trading Guide",
        description: "PDF guide covering Fibonacci retracements, extensions, and confluence zones.",
        type: "PDF",
        url: "https://example.com/fibonacci-guide.pdf",
        membershipRequired: true,
        isPublished: true,
      },
    }),
    prisma.content.upsert({
      where: { id: "content-004" },
      update: {},
      create: {
        id: "content-004",
        title: "Market Structure Cheat Sheet",
        description: "Quick reference for identifying HH/HL, LH/LL, and trend reversals.",
        type: "RESOURCE",
        url: "https://example.com/market-structure.pdf",
        membershipRequired: false,
        isPublished: true,
      },
    }),
    prisma.content.upsert({
      where: { id: "content-005" },
      update: {},
      create: {
        id: "content-005",
        title: "July 2026 BTC Analysis Replay",
        description: "Full replay of the live BTC analysis session from July 2026.",
        type: "REPLAY",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        membershipRequired: true,
        isPublished: true,
        duration: 90,
      },
    }),
  ]);

  console.log(`✓ ${content.length} content items`);

  // Live sessions
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  await prisma.liveSession.upsert({
    where: { id: "session-001" },
    update: {},
    create: {
      id: "session-001",
      title: "Weekly Market Overview — BTC & ETH",
      description: "Join us for a deep-dive into this week's crypto markets, key levels, and trade setups.",
      scheduledAt: tomorrow,
      streamUrl: "https://www.youtube.com/live/dQw4w9WgXcQ",
      membersOnly: true,
    },
  });

  await prisma.liveSession.upsert({
    where: { id: "session-002" },
    update: {},
    create: {
      id: "session-002",
      title: "Altcoin Season Deep Dive",
      description: "Identifying the best altcoin plays as the market heats up.",
      scheduledAt: in3Days,
      membersOnly: false,
    },
  });

  await prisma.liveSession.upsert({
    where: { id: "session-003" },
    update: {},
    create: {
      id: "session-003",
      title: "June Market Recap",
      description: "Review of all major moves in June and lessons learned.",
      scheduledAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 7200000),
      replayUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      membersOnly: true,
    },
  });

  console.log("✓ 3 live sessions");

  // Community links
  await prisma.community.upsert({
    where: { id: "community-001" },
    update: {},
    create: {
      id: "community-001",
      name: "StoxOptionHub Members Telegram",
      type: "TELEGRAM",
      url: "https://t.me/stoxoptionhub_members",
      isActive: true,
    },
  });

  await prisma.community.upsert({
    where: { id: "community-002" },
    update: {},
    create: {
      id: "community-002",
      name: "StoxOptionHub Discord",
      type: "DISCORD",
      url: "https://discord.gg/stoxoptionhub",
      isActive: true,
    },
  });

  console.log("✓ 2 community links");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@StoxOptionHub1", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@stoxoptionhub.io" },
    update: {},
    create: {
      email: "admin@stoxoptionhub.io",
      password: adminPassword,
      name: "StoxOptionHub Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 0 },
  });

  // Demo member with funded wallet and active membership
  const memberPassword = await bcrypt.hash("Demo@StoxOptionHub1", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@stoxoptionhub.io" },
    update: {},
    create: {
      email: "demo@stoxoptionhub.io",
      password: memberPassword,
      name: "Alex Rivera",
      role: "MEMBER",
      emailVerified: true,
    },
  });

  const demoWallet = await prisma.wallet.upsert({
    where: { userId: demo.id },
    update: { balance: 3250 },
    create: { userId: demo.id, balance: 3250 },
  });

  // Give demo user an active Pro Trader membership
  const proplan = plans.find((p) => p.name === "Pro Trader")!;
  const existing = await prisma.membership.findFirst({
    where: { userId: demo.id, planId: proplan.id, status: "ACTIVE" },
  });
  if (!existing) {
    await prisma.membership.create({
      data: {
        userId: demo.id,
        planId: proplan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        paidAt: new Date(),
        amount: proplan.price,
      },
    });
  }

  // Give demo user an active allocation
  const goldStrategy = strategies.find((s) => s.name === "Gold Trend Follower")!;
  const existingAlloc = await prisma.allocation.findFirst({
    where: { userId: demo.id, strategyId: goldStrategy.id, status: "ACTIVE" },
  });
  if (!existingAlloc) {
    await prisma.allocation.create({
      data: {
        userId: demo.id,
        strategyId: goldStrategy.id,
        amount: 1000,
        status: "ACTIVE",
      },
    });
  }

  // A few sample transactions for demo user
  const txCount = await prisma.transaction.count({ where: { userId: demo.id } });
  if (txCount === 0) {
    await prisma.transaction.createMany({
      data: [
        {
          walletId: demoWallet.id,
          userId: demo.id,
          type: "DEPOSIT",
          amount: 5000,
          status: "COMPLETED",
          description: "Initial deposit",
          reference: "TXN-SEED-001",
          createdAt: new Date(Date.now() - 10 * 86400000),
          updatedAt: new Date(Date.now() - 10 * 86400000),
        },
        {
          walletId: demoWallet.id,
          userId: demo.id,
          type: "WITHDRAWAL",
          amount: 149,
          status: "COMPLETED",
          description: "Membership: Pro Trader",
          createdAt: new Date(Date.now() - 9 * 86400000),
          updatedAt: new Date(Date.now() - 9 * 86400000),
        },
        {
          walletId: demoWallet.id,
          userId: demo.id,
          type: "ALLOCATION_OUT",
          amount: 1000,
          status: "COMPLETED",
          description: "Allocated to Gold Trend Follower",
          createdAt: new Date(Date.now() - 7 * 86400000),
          updatedAt: new Date(Date.now() - 7 * 86400000),
        },
        {
          walletId: demoWallet.id,
          userId: demo.id,
          type: "WITHDRAWAL",
          amount: 500,
          status: "PENDING",
          description: "Withdrawal request",
          createdAt: new Date(Date.now() - 2 * 86400000),
          updatedAt: new Date(Date.now() - 2 * 86400000),
        },
      ],
    });
  }

  console.log(`✓ Admin: admin@stoxoptionhub.io / Admin@StoxOptionHub1`);
  console.log(`✓ Demo:  demo@stoxoptionhub.io  / Demo@StoxOptionHub1`);
  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
