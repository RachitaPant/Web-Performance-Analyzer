import { z } from "zod";
import type { BudgetCheck, Comparison } from "@/lib/budget";
import { formatMetric } from "@/lib/ciComment";
import { formatMs } from "@/lib/format";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import type { Report } from "@/lib/report";
import { normalizeEvidenceId } from "./grounding";
import { getLlm } from "./llm";
import { REGRESSION_SYSTEM_PROMPT } from "./prompts";

const RegressionOutputSchema = z.object({
  summary: z.string(),
  causes: z.array(z.object({ text: z.string(), evidence: z.array(z.string()) })),
});
export type RegressionExplanation = z.infer<typeof RegressionOutputSchema>;

const describeComparison = (comparison: Comparison | null, checks: BudgetCheck[]) =>
  [
    ...checks
      .filter((c) => !c.pass)
      .map((c) => `- Budget broken: ${c.label} is ${formatMetric(c.unit, c.actual)} (limit ${formatMetric(c.unit, c.limit)})`),
    ...(comparison?.deltas ?? [])
      .filter((d) => d.regressed)
      .map((d) => `- Regressed vs production: ${d.label} went from ${formatMetric(d.unit, d.base)} to ${formatMetric(d.unit, d.head)}`),
    ...(comparison?.opportunityChanges ?? []).map((c) =>
      c.status === "new"
        ? `- New failing audit: ${c.title} (opportunity:${c.id})`
        : `- Worse audit: ${c.title} (opportunity:${c.id}), est. savings ${formatMs(c.baseSavingsMs)} -> ${formatMs(c.savingsMs)}`
    ),
  ].join("\n") || "- No measured changes beyond noise.";

// Values are formatted with units (as in the evidence): raw numbers like "2324" for bytes were
// misread by the model as "2.3 MB" in a live run.
// Grounded, short explanation for the PR comment. Causes citing unknown evidence are dropped.
export const explainRegression = async (
  head: Report,
  comparison: Comparison | null,
  checks: BudgetCheck[]
): Promise<RegressionExplanation> => {
  const evidence = buildEvidence(head);
  const valid = new Set(evidence.map((e) => e.id));

  const { data } = await getLlm().generateJson({
    system: REGRESSION_SYSTEM_PROMPT,
    user: `<report_evidence>\n${renderEvidence(head, evidence)}\n</report_evidence>\n\n<comparison>\n${describeComparison(comparison, checks)}\n</comparison>\n\nExplain what most likely changed.`,
    schema: RegressionOutputSchema,
    schemaName: "regression_explanation",
    effort: "medium",
  });

  const causes = data.causes
    .map((c) => ({ text: c.text, evidence: [...new Set(c.evidence.map(normalizeEvidenceId).filter(Boolean))] }))
    .filter((c) => c.evidence.length > 0 && c.evidence.every((id) => valid.has(id)))
    .slice(0, 4);
  return { summary: data.summary, causes };
};
