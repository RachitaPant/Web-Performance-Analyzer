import { NextResponse } from "next/server";
import { z } from "zod";
import { ReportSchema } from "@/lib/report";
import { AiError } from "@/server/ai/llm";
import { clientIdFrom } from "@/server/rateLimit";
import { getInsights, RateLimitedError } from "@/server/services";

// AI calls finish in ~5 s; 60 s leaves room for a fallback model and a JSON repair.
export const maxDuration = 60;

const RequestSchema = z.object({ report: ReportSchema }, { error: "Request body must include a report." });

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Request body must include a valid report." }, { status: 400 });
  }

  try {
    const { insights, cached } = await getInsights(parsed.data.report, clientIdFrom(req));
    return NextResponse.json(insights, { headers: { "X-Cache": cached ? "HIT" : "MISS" } });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return NextResponse.json(
        { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
    const e = error instanceof AiError ? error : new AiError(500, "Something went wrong generating AI insights.");
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
}
