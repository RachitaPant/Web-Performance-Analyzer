import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/report";
import { AnalysisError, fetchPageSpeed, normalizeUrl } from "@/server/pagespeed";
import { transformPageSpeed } from "@/server/transformPageSpeed";

// Must exceed PSI_TIMEOUT_MS (100s) so slow audits fail with a friendly 504, not a platform kill.
export const maxDuration = 120;

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
    const url = normalizeUrl(parsed.data.url);
    const psi = await fetchPageSpeed(url, parsed.data.strategy);
    return NextResponse.json(transformPageSpeed(psi, url, parsed.data.strategy));
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
