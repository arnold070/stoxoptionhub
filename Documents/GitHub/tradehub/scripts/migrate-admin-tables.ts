import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL!;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

const migrations = [
  `ALTER TABLE users ADD COLUMN "isBanned" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN "deletedAt" TEXT`,
  `ALTER TABLE users ADD COLUMN "adminNote" TEXT`,
  `CREATE TABLE IF NOT EXISTS "site_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_config_key_key" UNIQUE ("key")
  )`,
  `CREATE TABLE IF NOT EXISTS "cms_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{}',
    "isPublished" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cms_pages_slug_key" UNIQUE ("slug")
  )`,
];

async function run() {
  console.log("Running admin tables migration...");
  for (const sql of migrations) {
    const preview = sql.replace(/\s+/g, " ").slice(0, 70);
    try {
      await db.execute(sql);
      console.log(`✓ ${preview}`);
    } catch (e: any) {
      if (
        e.message?.includes("duplicate column") ||
        e.message?.includes("already exists")
      ) {
        console.log(`⟳ already exists: ${preview}`);
      } else {
        console.error(`✗ FAILED: ${preview}\n  ${e.message}`);
        throw e;
      }
    }
  }
  console.log("Migration complete.");
}

run().catch(console.error);
