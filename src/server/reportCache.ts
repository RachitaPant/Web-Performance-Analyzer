import { REPORT_SCHEMA_VERSION, ReportSchema, type Report, type Strategy } from "@/lib/report";
import { cacheGet, cacheSet, hashKey } from "./kvCache";

// PSI results for a URL barely change within an hour; re-serving them is instant and free.
export const REPORT_CACHE_TTL_SECONDS = 60 * 60;

// Schema version in the key means a shape change never serves stale-format reports.
export const reportCacheKey = (url: string, strategy: Strategy) =>
  `sitepulse:report:v${REPORT_SCHEMA_VERSION}:${strategy}:${hashKey(url)}`;

export const getCachedReport = (key: string): Promise<Report | null> => cacheGet(key, ReportSchema);

export const setCachedReport = (key: string, report: Report): Promise<void> =>
  cacheSet(key, report, REPORT_CACHE_TTL_SECONDS);
