import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { processMaturities } from "@/lib/actions/investments";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processMaturities();
  return NextResponse.json({ ok: true, ...result });
}
