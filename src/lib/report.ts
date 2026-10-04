import { z } from "zod";

// The single contract between the PageSpeed transform, the API route and the UI.
// Bump REPORT_SCHEMA_VERSION whenever the shape changes so saved history can be migrated.
export const REPORT_SCHEMA_VERSION = 1;

export const STRATEGIES = ["mobile", "desktop"] as const;
export const StrategySchema = z.enum(STRATEGIES);
export type Strategy = z.infer<typeof StrategySchema>;

export const RatingSchema = z.enum(["good", "needs-improvement", "poor"]);
export type Rating = z.infer<typeof RatingSchema>;

// Lab metric from a single Lighthouse run. `value` is in ms, except CLS (unitless).
const LabMetricSchema = z.object({
  value: z.number().nullable(),
  displayValue: z.string().nullable(),
  score: z.number().min(0).max(1).nullable(),
});
export type LabMetric = z.infer<typeof LabMetricSchema>;

// 75th-percentile real-user value from the Chrome UX Report (CrUX).
const FieldMetricSchema = z.object({
  p75: z.number(),
  rating: RatingSchema,
});
export type FieldMetric = z.infer<typeof FieldMetricSchema>;

const CategoryScore = z.number().min(0).max(100).nullable();

export const ReportSchema = z.object({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  url: z.string(),
  finalUrl: z.string(),
  strategy: StrategySchema,
  fetchedAt: z.string(),
  lighthouseVersion: z.string(),
  analysisMs: z.number().nullable(),

  categories: z.object({
    performance: CategoryScore,
    accessibility: CategoryScore,
    bestPractices: CategoryScore,
    seo: CategoryScore,
  }),

  lab: z.object({
    fcp: LabMetricSchema,
    lcp: LabMetricSchema,
    tbt: LabMetricSchema,
    cls: LabMetricSchema,
    speedIndex: LabMetricSchema,
    ttfb: LabMetricSchema,
  }),

  // null when CrUX has no data for this URL or its origin (low-traffic sites).
  field: z
    .object({
      scope: z.enum(["url", "origin"]),
      lcp: FieldMetricSchema.nullable(),
      inp: FieldMetricSchema.nullable(),
      cls: FieldMetricSchema.nullable(),
      fcp: FieldMetricSchema.nullable(),
      ttfb: FieldMetricSchema.nullable(),
    })
    .nullable(),

  diagnostics: z.object({
    domSize: z.number().nullable(),
    requestCount: z.number().nullable(),
    totalBytes: z.number().nullable(),
    thirdPartyRequests: z.number().nullable(),
    thirdPartyBytes: z.number().nullable(),
    mainThreadMs: z.number().nullable(),
    jsBootupMs: z.number().nullable(),
    resources: z.array(
      z.object({
        type: z.string(),
        label: z.string(),
        requests: z.number(),
        bytes: z.number(),
      })
    ),
    mainThread: z.array(
      z.object({ group: z.string(), label: z.string(), ms: z.number() })
    ),
    thirdParties: z.array(
      z.object({
        entity: z.string(),
        bytes: z.number(),
        mainThreadMs: z.number(),
      })
    ),
  }),

  // Failing Lighthouse insights/diagnostics, ranked by estimated savings.
  opportunities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      displayValue: z.string().nullable(),
      score: z.number().nullable(),
      savingsMs: z.number(),
      savingsBytes: z.number(),
      metricSavings: z.record(z.string(), z.number()),
    })
  ),

  screenshot: z.string().nullable(),
});

export type Report = z.infer<typeof ReportSchema>;

export const AnalyzeRequestSchema = z.object(
  {
    url: z.string({ error: "Please enter a website URL." }).trim().min(1, "Please enter a website URL."),
    strategy: z
      .enum(STRATEGIES, { error: 'Device must be "mobile" or "desktop".' })
      .default("mobile"),
  },
  { error: "Request body must be JSON with a url field." }
);

// Compact, screenshot-free subset persisted to history and used for trend charts.
export const toHistorySnapshot = (report: Report) => ({
  schemaVersion: report.schemaVersion,
  strategy: report.strategy,
  fetchedAt: report.fetchedAt,
  categories: report.categories,
  lab: {
    fcp: report.lab.fcp.value,
    lcp: report.lab.lcp.value,
    tbt: report.lab.tbt.value,
    cls: report.lab.cls.value,
    speedIndex: report.lab.speedIndex.value,
  },
});
export type HistorySnapshot = ReturnType<typeof toHistorySnapshot>;
