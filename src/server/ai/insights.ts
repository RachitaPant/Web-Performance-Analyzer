import { InsightsOutputSchema, type InsightsResponse } from "@/lib/insights";
import type { Report } from "@/lib/report";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import { AiError, getLlm } from "./llm";
import { groundInsights } from "./grounding";
import { INSIGHTS_SYSTEM_PROMPT } from "./prompts";

// Prioritized, evidence-cited findings for one report, as schema-validated JSON.
export const generateInsights = async (report: Report): Promise<InsightsResponse> => {
  const llm = getLlm();
  const evidence = buildEvidence(report);
  const start = Date.now();

  try {
    const result = await llm.generateJson({
      system: INSIGHTS_SYSTEM_PROMPT,
      // Report data is fenced as untrusted data in the user turn, never in the system prompt.
      user: `<report_evidence>\n${renderEvidence(report, evidence)}\n</report_evidence>\n\nAnalyze this audit.`,
      schema: InsightsOutputSchema,
      schemaName: "audit_insights",
      effort: "medium",
    });

    const grounded = groundInsights(result.data, new Set(evidence.map((e) => e.id)));
    if (grounded.dropped.length > 0) {
      console.warn("Dropped ungrounded findings:", grounded.dropped.map((d) => d.reason));
    }

    return {
      summary: grounded.summary,
      findings: grounded.findings,
      meta: {
        model: result.model,
        droppedFindings: grounded.dropped.length,
        latencyMs: Date.now() - start,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheReadTokens: result.usage.cachedInputTokens,
      },
    };
  } catch (error) {
    if (error instanceof AiError) throw error;
    console.error("Unexpected AI error:", error);
    throw new AiError(500, "Something went wrong generating AI insights.");
  }
};
