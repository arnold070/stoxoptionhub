import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL!;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

const migrations = [
  `ALTER TABLE users ADD COLUMN "usdtAddress" TEXT`,
  `ALTER TABLE users ADD COLUMN "btcAddress" TEXT`,
  `ALTER TABLE users ADD COLUMN "bnbAddress" TEXT`,
];

async function run() {
  for (const sql of migrations) {
    try {
      await db.execute(sql);
      console.log(`✓ ${sql}`);
    } catch (e: any) {
      if (e.message?.includes("duplicate column")) {
        console.log(`⟳ already exists: ${sql}`);
      } else {
        console.error(`✗ ${sql}\n  ${e.message}`);
      }
    }
  }
  console.log("Done.");
}

run();
