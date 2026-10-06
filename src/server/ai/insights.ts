import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { InsightsOutputSchema, type InsightsResponse } from "@/lib/insights";
import type { Report } from "@/lib/report";
import { AI_MODEL, AiError, FALLBACK_PARAMS, getAnthropic, toAiError } from "./client";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import { groundInsights } from "./grounding";
import { INSIGHTS_SYSTEM_PROMPT } from "./prompts";

// Prioritized, evidence-cited findings for one report via structured output.
export const generateInsights = async (report: Report): Promise<InsightsResponse> => {
  const evidence = buildEvidence(report);
  const start = Date.now();

  try {
    const response = await getAnthropic().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      ...FALLBACK_PARAMS,
      // Explaining pre-ranked, structured data is moderate work; set explicitly (Opus 5.5 defaults to medium).
      output_config: { effort: "medium", format: betaZodOutputFormat(InsightsOutputSchema) },
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `<report_evidence>\n${renderEvidence(report, evidence)}\n</report_evidence>\n\nAnalyze this audit.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new AiError(422, "The AI declined to analyze this report.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new AiError(502, "The AI returned an incomplete analysis. Please try again.");
    }

    const grounded = groundInsights(response.parsed_output, new Set(evidence.map((e) => e.id)));
    if (grounded.dropped.length > 0) {
      console.warn("Dropped ungrounded findings:", grounded.dropped.map((d) => d.reason));
    }

    return {
      summary: grounded.summary,
      findings: grounded.findings,
      meta: {
        model: response.model,
        droppedFindings: grounded.dropped.length,
        latencyMs: Date.now() - start,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  } catch (error) {
    throw toAiError(error);
  }
};
