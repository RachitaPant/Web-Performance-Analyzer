import { z } from "zod";

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;

// What the model must return. Every finding cites evidence ids from the report's evidence
// list; the server drops any finding whose citations don't exist (see server/ai/grounding.ts).
export const InsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe("2-3 sentences: the overall verdict and the single most important thing to fix."),
  findings: z
    .array(
      z.object({
        severity: z.enum(SEVERITIES),
        title: z.string().describe("Short imperative, e.g. 'Defer render-blocking CSS'."),
        explanation: z
          .string()
          .describe("Why this matters for this page, quoting the measured values from the evidence."),
        fix: z.string().describe("Concrete steps a developer can take."),
        estimatedImpact: z
          .string()
          .describe("Expected improvement in measured terms, or 'Unknown' if the evidence has no estimate."),
        evidence: z
          .array(z.string())
          .describe("Evidence ids from the report this finding is based on. At least one."),
      })
    )
    .describe("3-6 findings, most impactful first."),
});
export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;
export type Finding = InsightsOutput["findings"][number];

// What /api/insights returns to the UI.
export const InsightsResponseSchema = z.object({
  summary: z.string(),
  findings: z.array(InsightsOutputSchema.shape.findings.element),
  meta: z.object({
    model: z.string(),
    droppedFindings: z.number(),
    latencyMs: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    cacheReadTokens: z.number(),
  }),
});
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;

export const ChatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});
export type ChatTurn = z.infer<typeof ChatTurnSchema>;
