import {
  REPORT_SCHEMA_VERSION,
  type FieldMetric,
  type LabMetric,
  type Rating,
  type Report,
  type Strategy,
} from "@/lib/report";

// Minimal typings for the parts of the PageSpeed Insights v5 response we read.
// PSI currently runs Lighthouse 13, where many classic audits were replaced by
// "*-insight" audits — keep ids here in sync with what the API actually returns.
interface PsiAudit {
  id: string;
  title: string;
  score: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  displayValue?: string;
  metricSavings?: Record<string, number>;
  details?: {
    type?: string;
    items?: Record<string, unknown>[];
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    data?: string;
  };
}

interface PsiCategory {
  score: number | null;
  auditRefs?: { id: string; group?: string }[];
}

interface CruxMetric {
  percentile: number;
  category: "FAST" | "AVERAGE" | "SLOW" | string;
}

interface CruxExperience {
  origin_fallback?: boolean;
  metrics?: Record<string, CruxMetric>;
}

export interface PsiResponse {
  id?: string;
  loadingExperience?: CruxExperience;
  originLoadingExperience?: CruxExperience;
  lighthouseResult: {
    lighthouseVersion: string;
    requestedUrl?: string;
    finalDisplayedUrl?: string;
    finalUrl?: string;
    fetchTime: string;
    timing?: { total?: number };
    audits: Record<string, PsiAudit | undefined>;
    categories: Record<string, PsiCategory | undefined>;
  };
}

// The part of a Report derived from PageSpeed alone; other sources are merged in by analyze().
export type PageSpeedReport = Omit<Report, "fieldHistory" | "security" | "sources">;

const MAX_OPPORTUNITIES = 10;
// Opportunity ranking only compares time-based savings; CLS/INP savings use other units.
const TIME_SAVINGS_KEYS = ["LCP", "FCP", "TBT"];
const SKIPPED_DISPLAY_MODES = new Set(["informative", "notApplicable", "manual", "error"]);

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const categoryScore = (c?: PsiCategory): number | null =>
  c?.score == null ? null : Math.round(c.score * 100);

const labMetric = (a?: PsiAudit): LabMetric => ({
  value: num(a?.numericValue),
  displayValue: a?.displayValue ?? null,
  score: num(a?.score),
});

const CRUX_RATING: Record<string, Rating> = {
  FAST: "good",
  AVERAGE: "needs-improvement",
  SLOW: "poor",
};

const fieldMetric = (m?: CruxMetric, divisor = 1): FieldMetric | null => {
  const rating = m && CRUX_RATING[m.category];
  if (!m || !rating) return null;
  return { p75: m.percentile / divisor, rating };
};

// Prefer URL-level CrUX data; fall back to origin-level; null if neither exists.
const transformField = (psi: PsiResponse): Report["field"] => {
  const urlLevel = psi.loadingExperience;
  const useUrl = !!urlLevel?.metrics && !urlLevel.origin_fallback;
  const source = useUrl ? urlLevel : psi.originLoadingExperience;
  const m = source?.metrics;
  if (!m || Object.keys(m).length === 0) return null;

  return {
    scope: useUrl ? "url" : "origin",
    lcp: fieldMetric(m.LARGEST_CONTENTFUL_PAINT_MS),
    inp: fieldMetric(m.INTERACTION_TO_NEXT_PAINT),
    // CrUX reports CLS multiplied by 100.
    cls: fieldMetric(m.CUMULATIVE_LAYOUT_SHIFT_SCORE, 100),
    fcp: fieldMetric(m.FIRST_CONTENTFUL_PAINT_MS),
    ttfb: fieldMetric(m.EXPERIMENTAL_TIME_TO_FIRST_BYTE),
  };
};

const items = (a?: PsiAudit) => a?.details?.items ?? [];

const transformDiagnostics = (
  audits: PsiResponse["lighthouseResult"]["audits"]
): Report["diagnostics"] => {
  const resourceItems = items(audits["resource-summary"]);
  const byType = (type: string) => resourceItems.find((i) => i.resourceType === type);
  const total = byType("total");
  const thirdParty = byType("third-party");

  return {
    domSize: num(audits["dom-size-insight"]?.numericValue),
    requestCount: num(total?.requestCount),
    totalBytes: num(audits["total-byte-weight"]?.numericValue) ?? num(total?.transferSize),
    thirdPartyRequests: num(thirdParty?.requestCount),
    thirdPartyBytes: num(thirdParty?.transferSize),
    mainThreadMs: num(audits["mainthread-work-breakdown"]?.numericValue),
    jsBootupMs: num(audits["bootup-time"]?.numericValue),
    resources: resourceItems
      .filter((i) => i.resourceType !== "total" && i.resourceType !== "third-party")
      .map((i) => ({
        type: String(i.resourceType),
        label: String(i.label ?? i.resourceType),
        requests: num(i.requestCount) ?? 0,
        bytes: num(i.transferSize) ?? 0,
      }))
      .filter((r) => r.requests > 0),
    mainThread: items(audits["mainthread-work-breakdown"]).map((i) => ({
      group: String(i.group),
      label: String(i.groupLabel ?? i.group),
      ms: num(i.duration) ?? 0,
    })),
    thirdParties: items(audits["third-parties-insight"])
      .map((i) => ({
        entity: String(i.entity),
        bytes: num(i.transferSize) ?? 0,
        mainThreadMs: num(i.mainThreadTime) ?? 0,
      }))
      .sort((a, b) => b.mainThreadMs - a.mainThreadMs),
  };
};

const transformOpportunities = (
  lh: PsiResponse["lighthouseResult"]
): Report["opportunities"] => {
  const refs = lh.categories.performance?.auditRefs ?? [];

  return refs
    .filter((r) => r.group === "insights" || r.group === "diagnostics")
    .map((r) => lh.audits[r.id])
    .filter((a): a is PsiAudit =>
      !!a &&
      a.score !== null &&
      a.score < 0.9 &&
      !SKIPPED_DISPLAY_MODES.has(a.scoreDisplayMode ?? "")
    )
    .map((a) => {
      const metricSavings = a.metricSavings ?? {};
      const savingsMs = Math.max(
        0,
        num(a.details?.overallSavingsMs) ?? 0,
        ...TIME_SAVINGS_KEYS.map((k) => num(metricSavings[k]) ?? 0)
      );
      return {
        id: a.id,
        title: a.title,
        displayValue: a.displayValue ?? null,
        score: a.score,
        savingsMs,
        savingsBytes: num(a.details?.overallSavingsBytes) ?? 0,
        metricSavings,
      };
    })
    .sort(
      (a, b) =>
        b.savingsMs - a.savingsMs ||
        b.savingsBytes - a.savingsBytes ||
        (a.score ?? 1) - (b.score ?? 1)
    )
    .slice(0, MAX_OPPORTUNITIES);
};

export const transformPageSpeed = (
  psi: PsiResponse,
  requestedUrl: string,
  strategy: Strategy
): PageSpeedReport => {
  const lh = psi.lighthouseResult;
  const { audits, categories } = lh;

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    url: requestedUrl,
    finalUrl: lh.finalDisplayedUrl ?? lh.finalUrl ?? requestedUrl,
    strategy,
    fetchedAt: lh.fetchTime,
    lighthouseVersion: lh.lighthouseVersion,
    analysisMs: num(lh.timing?.total),
    categories: {
      performance: categoryScore(categories.performance),
      accessibility: categoryScore(categories.accessibility),
      bestPractices: categoryScore(categories["best-practices"]),
      seo: categoryScore(categories.seo),
    },
    lab: {
      fcp: labMetric(audits["first-contentful-paint"]),
      lcp: labMetric(audits["largest-contentful-paint"]),
      tbt: labMetric(audits["total-blocking-time"]),
      cls: labMetric(audits["cumulative-layout-shift"]),
      speedIndex: labMetric(audits["speed-index"]),
      ttfb: labMetric(audits["server-response-time"]),
    },
    field: transformField(psi),
    diagnostics: transformDiagnostics(audits),
    opportunities: transformOpportunities(lh),
    screenshot: audits["final-screenshot"]?.details?.data ?? null,
  };
};
