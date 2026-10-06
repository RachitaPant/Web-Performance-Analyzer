import { SEVERITIES, type Finding, type InsightsOutput } from "@/lib/insights";

export interface GroundedInsights {
  summary: string;
  findings: Finding[];
  dropped: { finding: Finding; reason: string }[];
}

// Keeps only findings whose evidence ids all exist in the report. A finding citing nothing,
// or citing an id the model invented, is dropped rather than shown — the UI never displays
// a claim we can't trace back to measured data.
export const groundInsights = (output: InsightsOutput, validIds: Set<string>): GroundedInsights => {
  const findings: Finding[] = [];
  const dropped: GroundedInsights["dropped"] = [];

  for (const finding of output.findings) {
    const evidence = [...new Set(finding.evidence.map((id) => id.trim()))];
    const unknown = evidence.filter((id) => !validIds.has(id));

    if (evidence.length === 0) {
      dropped.push({ finding, reason: "cites no evidence" });
    } else if (unknown.length > 0) {
      dropped.push({ finding, reason: `cites unknown evidence: ${unknown.join(", ")}` });
    } else {
      findings.push({ ...finding, evidence });
    }
  }

  // Stable severity order; the model's own ordering is kept within a severity.
  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
  return { summary: output.summary, findings, dropped };
};
