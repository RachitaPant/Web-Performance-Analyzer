import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/report";
import { AnalysisError } from "@/server/pagespeed";
import { clientIdFrom } from "@/server/rateLimit";
import { getReport, RateLimitedError } from "@/server/services";

// Requires Fluid Compute on Vercel Hobby (max 300 s; 60 s without it). PSI has a 150 s deadline,
// so slow audits end in a friendly 504, not a platform kill.
export const maxDuration = 180;

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
    const { url, strategy, refresh } = parsed.data;
    const { report, cached } = await getReport(url, strategy, clientIdFrom(req), refresh);
    return NextResponse.json(report, { headers: { "X-Cache": cached ? "HIT" : "MISS" } });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return NextResponse.json(
        { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
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
