import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/report";
import { analyze } from "@/server/analyze";
import { AnalysisError, normalizeUrl } from "@/server/pagespeed";
import { clientIdFrom, limitAnalyze } from "@/server/rateLimit";
import { getCachedReport, reportCacheKey, setCachedReport } from "@/server/reportCache";

// Must exceed PSI_TIMEOUT_MS (100s) so slow audits fail with a friendly 504, not a platform kill.
export const maxDuration = 120;

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const { strategy, refresh } = parsed.data;
    const url = normalizeUrl(parsed.data.url);
    const cacheKey = reportCacheKey(url, strategy);

    // Cache before rate limit: re-opening a recent report is free and doesn't use quota.
    if (!refresh) {
      const cached = await getCachedReport(cacheKey);
      if (cached) return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const limit = await limitAnalyze(clientIdFrom(req));
    if (!limit.success) {
      return NextResponse.json(
        {
          error: `You've reached the limit for new audits. Try again in about ${minutes(limit.retryAfterSeconds)} min — recently analyzed URLs still load instantly.`,
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const report = await analyze(url, strategy);
    await setCachedReport(cacheKey, report);
    return NextResponse.json(report, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    if (error instanceof AnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected analyze error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again in a moment." },
      { status: 500 }
    );
  }
}
