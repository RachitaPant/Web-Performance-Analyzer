import { z } from "zod";
import { StrategySchema, type Report } from "@/lib/report";

// Performance budgets for CI (.sitepulse/budget.json). Budgets are hard limits that fail the
// check; regressions compare a deployment against a baseline (usually production) and only
// warn by default, because Lighthouse lab numbers vary run to run.

export const BudgetConfigSchema = z.object({
  // Lighthouse runs per page; the median run is used. One run is too noisy to gate on
  // (the same page measured 97 and 67 an hour apart).
  runs: z.number().int().min(1).max(5).default(3),
  pages: z
    .array(z.object({ path: z.string().startsWith("/").default("/"), strategy: StrategySchema.default("mobile") }))
    .min(1)
    .default([{ path: "/", strategy: "mobile" }]),
  budgets: z
    .object({
      performance: z.number().min(0).max(100).optional(), // minimum Lighthouse score
      lcpMs: z.number().positive().optional(),
      tbtMs: z.number().nonnegative().optional(),
      cls: z.number().nonnegative().optional(),
      fcpMs: z.number().positive().optional(),
      totalBytes: z.number().positive().optional(),
    })
    .default({}),
  regression: z
    .object({
      performancePoints: z.number().nonnegative().default(5), // score drop that counts as a regression
      timingPercent: z.number().nonnegative().default(20), // timing increase that counts
      failOnRegression: z.boolean().default(false),
    })
    .default({ performancePoints: 5, timingPercent: 20, failOnRegression: false }),
});
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;

type MetricKey = "performance" | "lcpMs" | "tbtMs" | "cls" | "fcpMs" | "totalBytes";

interface MetricDef {
  key: MetricKey;
  label: string;
  // "max" = higher is worse (timings, bytes); "min" = lower is worse (score).
  kind: "max" | "min";
  unit: "score" | "ms" | "cls" | "bytes";
  read: (r: Report) => number | null;
}

export const METRICS: MetricDef[] = [
  { key: "performance", label: "Performance score", kind: "min", unit: "score", read: (r) => r.categories.performance },
  { key: "lcpMs", label: "LCP", kind: "max", unit: "ms", read: (r) => r.lab.lcp.value },
  { key: "tbtMs", label: "TBT", kind: "max", unit: "ms", read: (r) => r.lab.tbt.value },
  { key: "cls", label: "CLS", kind: "max", unit: "cls", read: (r) => r.lab.cls.value },
  { key: "fcpMs", label: "FCP", kind: "max", unit: "ms", read: (r) => r.lab.fcp.value },
  { key: "totalBytes", label: "Page weight", kind: "max", unit: "bytes", read: (r) => r.diagnostics.totalBytes },
];

export interface BudgetCheck {
  key: MetricKey;
  label: string;
  unit: MetricDef["unit"];
  limit: number;
  actual: number | null;
  pass: boolean;
}

// A metric the report can't measure fails its budget: an unmeasured budget isn't a passed one.
export const evaluateBudgets = (report: Report, budgets: BudgetConfig["budgets"]): BudgetCheck[] =>
  METRICS.filter((m) => budgets[m.key] !== undefined).map((m) => {
    const limit = budgets[m.key]!;
    const actual = m.read(report);
    const pass = actual !== null && (m.kind === "min" ? actual >= limit : actual <= limit);
    return { key: m.key, label: m.label, unit: m.unit, limit, actual, pass };
  });

export interface MetricDelta {
  key: MetricKey;
  label: string;
  unit: MetricDef["unit"];
  base: number | null;
  head: number | null;
  regressed: boolean;
}

export interface OpportunityChange {
  id: string;
  title: string;
  status: "new" | "worse";
  savingsMs: number;
  baseSavingsMs: number;
}

// Below this, a change in an opportunity's estimated savings is lab noise.
const OPPORTUNITY_NOISE_MS = 200;
const OPPORTUNITY_NOISE_BYTES = 50_000;

// A regression must also be large in absolute terms: on a near-zero baseline a percentage is
// meaningless (TBT 25 -> 131 ms is "+424%" yet still well inside Google's "good" range).
const MIN_REGRESSION_MS = 200;
const MIN_REGRESSION_BYTES = 50_000;

export const compareReports = (base: Report, head: Report, regression: BudgetConfig["regression"]) => {
  const deltas: MetricDelta[] = METRICS.map((m) => {
    const b = m.read(base);
    const h = m.read(head);
    let regressed = false;
    if (b !== null && h !== null) {
      if (m.unit === "score") regressed = b - h >= regression.performancePoints;
      else if (m.unit === "cls") regressed = h - b > 0.05; // CLS is unitless; percentages near 0 are meaningless
      else {
        const floor = m.unit === "bytes" ? MIN_REGRESSION_BYTES : MIN_REGRESSION_MS;
        regressed = h > b && b > 0 && h - b >= floor && ((h - b) / b) * 100 >= regression.timingPercent;
      }
    }
    return { key: m.key, label: m.label, unit: m.unit, base: b, head: h, regressed };
  });

  const baseById = new Map(base.opportunities.map((o) => [o.id, o]));
  const opportunityChanges: OpportunityChange[] = head.opportunities
    .map((o): OpportunityChange | null => {
      const before = baseById.get(o.id);
      if (!before) {
        // A newly failing audit with negligible estimated savings is lab noise, not news.
        if (o.savingsMs < OPPORTUNITY_NOISE_MS && o.savingsBytes < OPPORTUNITY_NOISE_BYTES) return null;
        return { id: o.id, title: o.title, status: "new", savingsMs: o.savingsMs, baseSavingsMs: 0 };
      }
      if (o.savingsMs - before.savingsMs >= OPPORTUNITY_NOISE_MS) {
        return { id: o.id, title: o.title, status: "worse", savingsMs: o.savingsMs, baseSavingsMs: before.savingsMs };
      }
      return null;
    })
    .filter((c): c is OpportunityChange => c !== null);

  return { deltas, opportunityChanges, regressed: deltas.some((d) => d.regressed) };
};
export type Comparison = ReturnType<typeof compareReports>;

// The run with the median performance score (Lighthouse CI's approach). Picking a whole run,
// rather than the median of each metric separately, keeps the metrics internally consistent.
export const pickMedianRun = <T extends { categories: { performance: number | null } }>(runs: T[]): T => {
  if (runs.length === 0) throw new Error("pickMedianRun needs at least one run");
  const sorted = [...runs].sort((a, b) => (a.categories.performance ?? -1) - (b.categories.performance ?? -1));
  return sorted[Math.floor((sorted.length - 1) / 2)];
};
