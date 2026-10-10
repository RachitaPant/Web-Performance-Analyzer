import type { ChatTurn } from "@/lib/insights";
import type { Report } from "@/lib/report";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import { AiError, getLlm } from "./llm";
import { CHAT_SYSTEM_PROMPT } from "./prompts";

// Opens the model stream first (so auth/rate-limit/config errors surface as HTTP errors),
// then pipes text deltas to the client. The evidence sits in a system prompt that stays
// identical across turns, so providers with automatic prefix caching can reuse it.
export const streamChatAnswer = async (report: Report, turns: ChatTurn[]): Promise<ReadableStream<Uint8Array>> => {
  const encoder = new TextEncoder();
  const deltas = await getLlm().streamText({
    system: `${CHAT_SYSTEM_PROMPT}\n\n<report_evidence>\n${renderEvidence(report, buildEvidence(report))}\n</report_evidence>`,
    messages: turns,
    effort: "low",
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of deltas) controller.enqueue(encoder.encode(text));
      } catch (error) {
        console.error("Chat stream failed:", error);
        const message = error instanceof AiError ? error.message : "The answer was interrupted. Please try again.";
        controller.enqueue(encoder.encode(`\n\n_${message}_`));
      } finally {
        controller.close();
      }
    },
  });
};
