import type Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/lib/insights";
import type { Report } from "@/lib/report";
import { AI_MODEL, FALLBACK_PARAMS, getAnthropic, toAiError } from "./client";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import { CHAT_SYSTEM_PROMPT } from "./prompts";

// Streams an answer as plain-text chunks. The evidence sits in the system prompt, which stays
// identical across turns of a conversation, so automatic caching reuses the whole prefix.
export const streamChatAnswer = (report: Report, turns: ChatTurn[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  const anthropic = getAnthropic(); // throws AiError(503) before streaming if not configured

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = anthropic.beta.messages.stream({
          model: AI_MODEL,
          // Hard cap for a public endpoint; answers are meant to be short.
          max_tokens: 8000,
          ...FALLBACK_PARAMS,
          output_config: { effort: "low" },
          cache_control: { type: "ephemeral" },
          system: [
            { type: "text", text: CHAT_SYSTEM_PROMPT },
            { type: "text", text: `<report_evidence>\n${renderEvidence(report, buildEvidence(report))}\n</report_evidence>` },
          ],
          messages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n_The AI declined to answer this question._"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n_Answer truncated._"));
        }
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`\n\n_${toAiError(error).message}_`));
        controller.close();
      }
    },
  });
};
