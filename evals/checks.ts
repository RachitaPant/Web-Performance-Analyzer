import type { InsightsResponse } from "@/lib/insights";
import type { EvidenceItem } from "@/lib/evidence";

export interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

// Share of the model's findings that survived grounding (cited only real evidence ids).
export const groundingRate = (r: InsightsResponse) => {
  const total = r.findings.length + r.meta.droppedFindings;
  return total === 0 ? 1 : r.findings.length / total;
};

// Time quantities like "3.9 s" or "963 ms", in ms.
export const extractDurations = (text: string): { text: string; ms: number }[] =>
  [...text.matchAll(/(\d+(?:\.\d+)?)\s?(ms|s)\b/g)].map((m) => ({
    text: m[0],
    ms: Number(m[1]) * (m[2] === "s" ? 1000 : 1),
  }));

// Every duration the model states as a fact (summary + explanations) must match a measured
// value in the evidence, allowing for display rounding (0.1 s) — catches invented numbers.
// estimatedImpact and fix text are excluded: they legitimately contain targets and estimates.
export const numberAccuracy = (r: InsightsResponse, evidence: EvidenceItem[]) => {
  const known = evidence.map((e) => e.raw).filter((v): v is number => v != null);
  const stated = [r.summary, ...r.findings.map((f) => f.explanation)].flatMap(extractDurations);
  // Thresholds the prompt itself provides are fair to quote.
  const thresholds = [200, 500, 2500, 4000];
  const unmatched = stated.filter(
    (d) =>
      !thresholds.includes(d.ms) &&
      !known.some((k) => Math.abs(k - d.ms) <= Math.max(50, k * 0.05))
  );
  return { total: stated.length, unmatched: unmatched.map((d) => d.text) };
};

export const allText = (r: InsightsResponse) =>
  [r.summary, ...r.findings.flatMap((f) => [f.title, f.explanation, f.fix, f.estimatedImpact])].join("\n");

// Checks every case gets, on top of its own expectations.
export const baseChecks = (r: InsightsResponse, evidence: EvidenceItem[]): CheckResult[] => {
  const rate = groundingRate(r);
  const numbers = numberAccuracy(r, evidence);
  return [
    {
      name: "fully grounded",
      pass: r.meta.droppedFindings === 0,
      detail: `${Math.round(rate * 100)}% of findings cite only real evidence (${r.meta.droppedFindings} dropped)`,
    },
    {
      name: "3-6 findings",
      pass: r.findings.length >= 3 && r.findings.length <= 6,
      detail: `${r.findings.length} findings`,
    },
    {
      name: "no invented durations",
      pass: numbers.unmatched.length === 0,
      detail:
        numbers.unmatched.length === 0
          ? `${numbers.total} stated durations all match evidence`
          : `unmatched: ${numbers.unmatched.join(", ")}`,
    },
  ];
};
