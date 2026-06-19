import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

const settings: { key: string; value: string }[] = [
  { key: "livechat_enabled",   value: "true" },
  { key: "livechat_provider",  value: "jivo" },
  { key: "livechat_widget_id", value: "0TczbF90HW" },
];

async function run() {
  for (const { key, value } of settings) {
    const existing = await client.execute({
      sql: `SELECT id FROM "SiteConfig" WHERE key = ?`,
      args: [key],
    });

    if (existing.rows.length > 0) {
      await client.execute({
        sql: `UPDATE "SiteConfig" SET value = ?, "updatedAt" = ? WHERE key = ?`,
        args: [value, new Date().toISOString(), key],
      });
      console.log(`updated  ${key} = ${value}`);
    } else {
      await client.execute({
        sql: `INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), key, value, new Date().toISOString(), new Date().toISOString()],
      });
      console.log(`inserted ${key} = ${value}`);
    }
  }
  client.close();
  console.log("done");
}

run().catch((e) => { console.error(e); process.exit(1); });
