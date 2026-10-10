import type { FieldHistoryWeek, Report, Strategy } from "@/lib/report";
import { OPTIONAL_SOURCE_TIMEOUT_MS, SourceUnavailableError } from "./sources";

const CRUX_HISTORY_ENDPOINT =
  "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord";
const METRICS = ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"];
const FORM_FACTOR: Record<Strategy, string> = { mobile: "PHONE", desktop: "DESKTOP" };

interface CruxDate {
  year: number;
  month: number;
  day: number;
}

// p75s are numbers for timing metrics and strings for CLS; missing weeks are null or "NaN".
type P75 = number | string | null;

export interface CruxHistoryRecord {
  metrics?: Record<string, { percentilesTimeseries?: { p75s?: P75[] } } | undefined>;
  collectionPeriods?: { firstDate: CruxDate; lastDate: CruxDate }[];
}

const toIsoDate = ({ year, month, day }: CruxDate) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const toNumber = (v: P75 | undefined): number | null => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

export const transformCruxHistory = (record: CruxHistoryRecord): FieldHistoryWeek[] => {
  const p75s = (metric: string) => record.metrics?.[metric]?.percentilesTimeseries?.p75s ?? [];
  const lcp = p75s("largest_contentful_paint");
  const inp = p75s("interaction_to_next_paint");
  const cls = p75s("cumulative_layout_shift");

  return (record.collectionPeriods ?? []).map((period, i) => ({
    end: toIsoDate(period.lastDate),
    lcp: toNumber(lcp[i]),
    inp: toNumber(inp[i]),
    cls: toNumber(cls[i]),
  }));
};

const query = async (
  target: { url: string } | { origin: string },
  strategy: Strategy,
  apiKey: string
): Promise<CruxHistoryRecord | null> => {
  const res = await fetch(`${CRUX_HISTORY_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...target, formFactor: FORM_FACTOR[strategy], metrics: METRICS }),
    signal: AbortSignal.timeout(OPTIONAL_SOURCE_TIMEOUT_MS),
    cache: "no-store",
  });

  if (res.ok) return ((await res.json()) as { record: CruxHistoryRecord }).record;
  if (res.status === 404) return null; // CrUX has no data for this key

  if (res.status === 403) {
    throw new SourceUnavailableError(
      "Chrome UX Report API isn't enabled for this API key. Enable it in Google Cloud to see trends."
    );
  }
  throw new Error(`CrUX History API responded ${res.status}`);
};

// Weekly real-user p75 trend for the URL, falling back to its origin.
export const fetchCruxHistory = async (
  url: string,
  strategy: Strategy
): Promise<NonNullable<Report["fieldHistory"]>> => {
  const apiKey = process.env.CRUX_API_KEY ?? process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) throw new SourceUnavailableError("No Google API key configured.");

  const urlRecord = await query({ url }, strategy, apiKey);
  if (urlRecord) return { scope: "url", weeks: transformCruxHistory(urlRecord) };

  const originRecord = await query({ origin: new URL(url).origin }, strategy, apiKey);
  if (originRecord) return { scope: "origin", weeks: transformCruxHistory(originRecord) };

  throw new SourceUnavailableError("Not enough real-user traffic for a CrUX trend.");
};
