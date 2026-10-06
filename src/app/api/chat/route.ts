import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatTurnSchema } from "@/lib/insights";
import { ReportSchema } from "@/lib/report";
import { AiError } from "@/server/ai/client";
import { streamChatAnswer } from "@/server/ai/chat";
import { clientIdFrom, limitAi } from "@/server/rateLimit";

export const maxDuration = 120;

const MAX_TURNS = 20;

const RequestSchema = z.object({
  report: ReportSchema,
  messages: z
    .array(ChatTurnSchema)
    .min(1)
    .max(MAX_TURNS)
    // Must alternate user/assistant, starting and ending with the user.
    .refine((m) => m.every((t, i) => t.role === (i % 2 === 0 ? "user" : "assistant")), "Turns must alternate, starting with the user.")
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "The last turn must be a user question."),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json(
      { error: tooLong ? "This conversation is too long — start a new one." : "Invalid chat request." },
      { status: 400 }
    );
  }

  const limit = await limitAi(clientIdFrom(req));
  if (!limit.success) {
    return NextResponse.json(
      { error: "You've reached the limit for AI requests. Please try again in a few minutes.", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const stream = streamChatAnswer(parsed.data.report, parsed.data.messages);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const e = error instanceof AiError ? error : new AiError(500, "Something went wrong.");
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
}
