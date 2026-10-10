import type { Report } from "@/lib/report";
import { OPTIONAL_SOURCE_TIMEOUT_MS, SourceUnavailableError } from "./sources";

const OBSERVATORY_ENDPOINT = "https://observatory-api.mdn.mozilla.net/api/v2/scan";

interface ObservatoryScan {
  grade: string | null;
  score: number | null;
  tests_passed: number;
  tests_failed: number;
  details_url: string;
  error: string | null;
}

// Mozilla HTTP Observatory: grades security headers (CSP, HSTS, etc.). Free, no key.
export const fetchObservatory = async (url: string): Promise<NonNullable<Report["security"]>> => {
  const host = new URL(url).hostname;
  const res = await fetch(`${OBSERVATORY_ENDPOINT}?host=${encodeURIComponent(host)}`, {
    method: "POST",
    signal: AbortSignal.timeout(OPTIONAL_SOURCE_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP Observatory responded ${res.status}`);

  const scan = (await res.json()) as ObservatoryScan;
  if (scan.error || scan.grade == null || scan.score == null) {
    throw new SourceUnavailableError(scan.error ?? "HTTP Observatory couldn't scan this site.");
  }

  return {
    grade: scan.grade,
    score: scan.score,
    testsPassed: scan.tests_passed,
    testsFailed: scan.tests_failed,
    detailsUrl: scan.details_url,
  };
};
