import { NextResponse } from "next/server";
import { z } from "zod";
import { InsightsResponseSchema } from "@/lib/insights";
import { ReportSchema } from "@/lib/report";
import { AI_MODEL, AiError } from "@/server/ai/client";
import { generateInsights } from "@/server/ai/insights";
import { cacheGet, cacheSet, hashKey } from "@/server/kvCache";
import { clientIdFrom, limitAi } from "@/server/rateLimit";

export const maxDuration = 120;

// Bump when the prompt or output schema changes so cached insights are regenerated.
const INSIGHTS_VERSION = "v1";
const INSIGHTS_CACHE_TTL_SECONDS = 24 * 60 * 60;

const RequestSchema = z.object({ report: ReportSchema }, { error: "Request body must include a report." });

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Request body must include a valid report." }, { status: 400 });
  }
  const { report } = parsed.data;

  // The same report (url + device + run time) always gets the same insights: serve them free.
  const cacheKey = `sitepulse:insights:${INSIGHTS_VERSION}:${hashKey(AI_MODEL, report.url, report.strategy, report.fetchedAt)}`;
  const cached = await cacheGet(cacheKey, InsightsResponseSchema);
  if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });

  const limit = await limitAi(clientIdFrom(req));
  if (!limit.success) {
    return NextResponse.json(
      { error: "You've reached the limit for AI requests. Please try again in a few minutes.", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const insights = await generateInsights(report);
    await cacheSet(cacheKey, insights, INSIGHTS_CACHE_TTL_SECONDS);
    return NextResponse.json(insights, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    const e = error instanceof AiError ? error : new AiError(500, "Something went wrong generating AI insights.");
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
}
