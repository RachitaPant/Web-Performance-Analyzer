import { z } from "zod";
import type { BudgetCheck, Comparison } from "./budget";
import { formatMetric } from "./ciComment";
import { formatMs } from "@/lib/format";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import type { Report } from "@/lib/report";
import { normalizeEvidenceId } from "@/server/ai/grounding";
import { getLlm } from "@/server/ai/llm";
import { SHARED_RULES } from "@/server/ai/prompts";

// CI-only prompt; lives here so editing it isn't counted as an app change (see changedFiles.ts).
const REGRESSION_SYSTEM_PROMPT = `${SHARED_RULES}

Task: a pull request's preview deployment was audited and compared with production. Explain, for the developer reviewing the PR, what most likely made performance worse or broke a budget.
- The report evidence describes the PR's preview. The comparison section lists measured changes versus production; treat it as data too.
- Write a 1-2 sentence summary, then 1-4 likely causes, most impactful first. Each cause must cite the preview's evidence ids it relies on, written without the square brackets.
- Lab metrics vary run to run. If the changes are small or inconsistent (some metrics better, some worse), say the result may be noise rather than inventing a cause.
- Only attribute a change to the PR's code if the listed changed files could plausibly cause it. Never claim a metric rose or fell unless the comparison says so.`;

const RegressionOutputSchema = z.object({
  summary: z.string(),
  causes: z.array(z.object({ text: z.string(), evidence: z.array(z.string()) })),
});
export type RegressionExplanation = z.infer<typeof RegressionOutputSchema>;

const direction = (d: Comparison["deltas"][number]) => {
  if (d.base === null || d.head === null) return "not comparable";
  if (d.regressed) return "regressed";
  if (d.head === d.base) return "unchanged";
  const better = d.unit === "score" ? d.head > d.base : d.head < d.base;
  return better ? "improved" : "slightly worse, within noise tolerance";
};

// Every metric is listed, including unchanged ones: given only the regressed metrics, the model
// once claimed an unchanged page weight had "risen".
const describeComparison = (comparison: Comparison | null, checks: BudgetCheck[], runtimeFiles: string[] | null) =>
  [
    runtimeFiles === null
      ? "- Changed files: unknown"
      : `- App files changed by this PR (${runtimeFiles.length}): ${runtimeFiles.slice(0, 30).join(", ") || "none"}`,
    ...checks
      .filter((c) => !c.pass)
      .map((c) => `- Budget broken: ${c.label} is ${formatMetric(c.unit, c.actual)} (limit ${formatMetric(c.unit, c.limit)})`),
    ...(comparison?.deltas ?? []).map(
      (d) => `- ${d.label} vs production: ${formatMetric(d.unit, d.base)} -> ${formatMetric(d.unit, d.head)} (${direction(d)})`
    ),
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
  checks: BudgetCheck[],
  runtimeFiles: string[] | null = null
): Promise<RegressionExplanation> => {
  const evidence = buildEvidence(head);
  const valid = new Set(evidence.map((e) => e.id));

  const { data } = await getLlm().generateJson({
    system: REGRESSION_SYSTEM_PROMPT,
    user: `<report_evidence>\n${renderEvidence(head, evidence)}\n</report_evidence>\n\n<comparison>\n${describeComparison(comparison, checks, runtimeFiles)}\n</comparison>\n\nExplain what most likely changed.`,
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
