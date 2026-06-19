import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const plans = [
  {
    name: "Beginner Track",
    price: 5000,
    duration: 42, // 6 weeks
    description:
      "A structured foundation for investors with little or no prior trading knowledge.",
    benefits:
      "Introduction to financial markets,Reading candlestick charts and timeframes,Understanding risk vs reward,Order types and execution basics,Introduction to crypto and forex markets",
    sortOrder: 1,
  },
  {
    name: "Intermediate Track",
    price: 15000,
    duration: 84, // 12 weeks
    description:
      "Deep-dive into technical analysis methodology used by professional traders.",
    benefits:
      "Technical indicators (RSI, MACD, Bollinger Bands),Support and resistance identification,Trend analysis and market structure,Volume analysis and confirmation,Building a trading system framework",
    sortOrder: 2,
  },
  {
    name: "Advanced Track",
    price: 35000,
    duration: 168, // 24 weeks
    description:
      "Advanced frameworks for managing capital, risk, and building systematic portfolios.",
    benefits:
      "Position sizing and capital allocation,Risk management frameworks (1R, Kelly, Fixed fractional),Portfolio diversification across asset classes,Drawdown management and recovery strategies,Building long-term sustainable trading systems",
    sortOrder: 3,
  },
];

async function run() {
  console.log("Seeding mentorship plans…\n");

  for (const plan of plans) {
    const existing = await client.execute({
      sql: `SELECT id FROM "plans" WHERE "name" = ?`,
      args: [plan.name],
    });

    if (existing.rows.length > 0) {
      console.log(`  ↳ "${plan.name}" already exists — updating`);
      await client.execute({
        sql: `UPDATE "plans"
              SET "price" = ?, "duration" = ?, "description" = ?,
                  "benefits" = ?, "sortOrder" = ?, "isActive" = 1,
                  "updatedAt" = CURRENT_TIMESTAMP
              WHERE "name" = ?`,
        args: [
          plan.price, plan.duration, plan.description,
          plan.benefits, plan.sortOrder, plan.name,
        ],
      });
    } else {
      console.log(`  ↳ Creating "${plan.name}"`);
      await client.execute({
        sql: `INSERT INTO "plans"
                ("id", "name", "price", "duration", "description", "benefits",
                 "maxMembers", "isActive", "sortOrder", "createdAt", "updatedAt")
              VALUES
                (lower(hex(randomblob(16))), ?, ?, ?, ?, ?,
                 NULL, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          plan.name, plan.price, plan.duration,
          plan.description, plan.benefits, plan.sortOrder,
        ],
      });
    }
  }

  const rows = await client.execute(
    `SELECT "name", "price", "duration", "isActive" FROM "plans" ORDER BY "sortOrder"`
  );
  console.log("\nPlans in DB:");
  for (const r of rows.rows) {
    const weeks = r.duration ? Math.round(Number(r.duration) / 7) : null;
    console.log(`  ${r.name}  $${r.price}  ${weeks ? weeks + " weeks" : "lifetime"}  active=${r.isActive}`);
  }

  console.log("\nDone.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
