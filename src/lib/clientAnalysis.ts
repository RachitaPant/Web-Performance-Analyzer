import { AnalysisError, normalizeUrl, requestPageSpeed } from "./psi";
import { ReportSchema, type Report, type Strategy } from "./report";
import { transformPageSpeed } from "./transformPageSpeed";

// How the browser gets a Report.
//
// With NEXT_PUBLIC_PSI_BROWSER_KEY set, Google PageSpeed runs from the browser: heavy pages can
// take PSI 100+ s, more than a serverless function may run, but a browser tab has no such
// limit. The server then only adds CrUX history + Observatory (/api/analyze/enrich).
// Without the key, the whole analysis runs server-side (/api/analyze), with caching.
//
// The browser key is public by design (it ships in the JS bundle), so it must be restricted in
// Google Cloud to HTTP referrers on this site's domain and to the PageSpeed Insights API only.

const BROWSER_PSI_KEY = process.env.NEXT_PUBLIC_PSI_BROWSER_KEY;
const BROWSER_PSI_DEADLINE_MS = 5 * 60_000;

export const usesBrowserPageSpeed = () => Boolean(BROWSER_PSI_KEY);

export class ReportRequestError extends Error {
  constructor(public status: number | null, message: string, public retryAfterSeconds?: number) {
    super(message);
    this.name = "ReportRequestError";
  }
}

export interface ReportResult {
  report: Report;
  cached: boolean;
}

const readReport = async (res: Response): Promise<Report> => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ReportRequestError(res.status, body?.error ?? "", body?.retryAfterSeconds);
  }
  const parsed = ReportSchema.safeParse(await res.json());
  if (!parsed.success) {
    console.error("Unexpected report shape:", parsed.error);
    throw new ReportRequestError(500, "");
  }
  return parsed.data;
};

const postJson = (path: string, body: unknown) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const viaBrowser = async (input: string, strategy: Strategy): Promise<ReportResult> => {
  let url: string;
  let pagespeedMs: number;
  let pagespeed;
  try {
    url = normalizeUrl(input);
    const start = Date.now();
    const psi = await requestPageSpeed(url, strategy, BROWSER_PSI_KEY!, BROWSER_PSI_DEADLINE_MS);
    pagespeedMs = Date.now() - start;
    pagespeed = transformPageSpeed(psi, url, strategy);
  } catch (error) {
    if (error instanceof AnalysisError) throw new ReportRequestError(error.status, error.message);
    throw error;
  }
  // The server re-validates the report before using it.
  return { report: await readReport(await postJson("/api/analyze/enrich", { pagespeed, pagespeedMs })), cached: false };
};

const viaServer = async (input: string, strategy: Strategy, refresh: boolean): Promise<ReportResult> => {
  const res = await postJson("/api/analyze", { url: input, strategy, refresh });
  const report = await readReport(res);
  return { report, cached: res.headers.get("X-Cache") === "HIT" };
};

export const requestReport = (input: string, strategy: Strategy, refresh = false): Promise<ReportResult> =>
  usesBrowserPageSpeed() ? viaBrowser(input.trim(), strategy) : viaServer(input.trim(), strategy, refresh);
