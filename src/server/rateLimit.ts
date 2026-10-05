import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// Fresh analyses per client IP. Cached results don't count, so re-opening a report is free.
export const ANALYZE_LIMIT = 10;
export const ANALYZE_WINDOW_SECONDS = 10 * 60;

export interface RateLimitResult {
  success: boolean;
  retryAfterSeconds: number;
}

let upstashLimiter: Ratelimit | undefined;
const memoryHits = new Map<string, number[]>();

const memoryLimit = (id: string, now = Date.now()): RateLimitResult => {
  const windowStart = now - ANALYZE_WINDOW_SECONDS * 1000;
  const hits = (memoryHits.get(id) ?? []).filter((t) => t > windowStart);

  if (hits.length >= ANALYZE_LIMIT) {
    memoryHits.set(id, hits);
    return { success: false, retryAfterSeconds: Math.ceil((hits[0] - windowStart) / 1000) };
  }
  hits.push(now);
  memoryHits.set(id, hits);
  return { success: true, retryAfterSeconds: 0 };
};

export const limitAnalyze = async (clientId: string): Promise<RateLimitResult> => {
  const redis = getRedis();
  if (!redis) return memoryLimit(clientId);

  upstashLimiter ??= new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ANALYZE_LIMIT, `${ANALYZE_WINDOW_SECONDS} s`),
    prefix: "sitepulse:ratelimit:analyze",
  });

  try {
    const { success, reset } = await upstashLimiter.limit(clientId);
    return { success, retryAfterSeconds: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    // Fail open: a Redis outage shouldn't take analysis down with it.
    console.error("Rate limiter failed, allowing request:", error);
    return { success: true, retryAfterSeconds: 0 };
  }
};

// Vercel and most proxies put the client first in x-forwarded-for.
export const clientIdFrom = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";

// Exposed for tests only.
export const __resetMemoryRateLimit = () => memoryHits.clear();
