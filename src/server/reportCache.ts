import { createHash } from "node:crypto";
import { REPORT_SCHEMA_VERSION, ReportSchema, type Report, type Strategy } from "@/lib/report";
import { getRedis } from "./redis";

// PSI results for a URL barely change within an hour; re-serving them is instant and free.
export const REPORT_CACHE_TTL_SECONDS = 60 * 60;
const MEMORY_CACHE_MAX_ENTRIES = 50;

// Schema version in the key means a shape change never serves stale-format reports.
export const reportCacheKey = (url: string, strategy: Strategy) =>
  `sitepulse:report:v${REPORT_SCHEMA_VERSION}:${strategy}:${createHash("sha256").update(url).digest("hex")}`;

const memory = new Map<string, { report: Report; expiresAt: number }>();

const memoryGet = (key: string): Report | null => {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.report;
};

const memorySet = (key: string, report: Report) => {
  memory.delete(key);
  memory.set(key, { report, expiresAt: Date.now() + REPORT_CACHE_TTL_SECONDS * 1000 });
  // Map preserves insertion order, so the first key is the oldest.
  if (memory.size > MEMORY_CACHE_MAX_ENTRIES) memory.delete(memory.keys().next().value!);
};

// Cache failures are logged and treated as a miss — caching must never break an analysis.
export const getCachedReport = async (key: string): Promise<Report | null> => {
  const redis = getRedis();
  try {
    const raw = redis ? await redis.get<unknown>(key) : memoryGet(key);
    if (raw == null) return null;
    const parsed = ReportSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("Report cache read failed:", error);
    return null;
  }
};

export const setCachedReport = async (key: string, report: Report): Promise<void> => {
  const redis = getRedis();
  try {
    if (redis) await redis.set(key, report, { ex: REPORT_CACHE_TTL_SECONDS });
    else memorySet(key, report);
  } catch (error) {
    console.error("Report cache write failed:", error);
  }
};
