import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { runScraper } from "~/lib/scraper";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const isProd = env.NODE_ENV === "production";
  const authHeader = req.headers.get("authorization");
  if (isProd && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runScraper();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cron/scrape]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
