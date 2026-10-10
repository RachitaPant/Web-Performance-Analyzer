import { NextResponse } from "next/server";
import { z } from "zod";
import { PageSpeedReportSchema } from "@/lib/report";
import { enrichPageSpeedReport } from "@/server/analyze";
import { AnalysisError, normalizeUrl } from "@/server/pagespeed";
import { clientIdFrom, limitAnalyze } from "@/server/rateLimit";

// Browser path: PageSpeed already ran client-side (no function time limit). This route only adds
// CrUX history + Observatory, which take ~2 s.
export const maxDuration = 60;

// A transformed report with its screenshot is ~40 KB; anything far larger isn't one of ours.
const MAX_BODY_BYTES = 512 * 1024;

const RequestSchema = z.object({
  pagespeed: PageSpeedReportSchema,
  pagespeedMs: z.number().nonnegative().nullable().default(null),
});

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Report payload is too large." }, { status: 413 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    // handled below
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PageSpeed report." }, { status: 400 });
  }

  try {
    const { pagespeed, pagespeedMs } = parsed.data;
    // Same public-URL rules as the server path, and the URL must already be normalized.
    if (normalizeUrl(pagespeed.url) !== pagespeed.url) {
      return NextResponse.json({ error: "Invalid report URL." }, { status: 400 });
    }

    const limit = await limitAnalyze(clientIdFrom(req));
    if (!limit.success) {
      return NextResponse.json(
        {
          error: `You've reached the limit for new audits. Try again in about ${Math.max(1, Math.ceil(limit.retryAfterSeconds / 60))} min.`,
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    // Never written to the shared report cache: this data came from the client, so caching it
    // would let one visitor serve fabricated results to everyone else.
    const report = await enrichPageSpeedReport(pagespeed, pagespeedMs);
    return NextResponse.json(report, { headers: { "X-Cache": "BYPASS" } });
  } catch (error) {
    if (error instanceof AnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected enrich error:", error);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}
