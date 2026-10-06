import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  retryAfterSeconds: number;
}

// Sliding-window limiter per client. Uses Upstash when configured, per-instance memory otherwise.
const createLimiter = (name: string, limit: number, windowSeconds: number) => {
  let upstash: Ratelimit | undefined;
  const memoryHits = new Map<string, number[]>();

  const memoryLimit = (id: string, now = Date.now()): RateLimitResult => {
    const windowStart = now - windowSeconds * 1000;
    const hits = (memoryHits.get(id) ?? []).filter((t) => t > windowStart);

    if (hits.length >= limit) {
      memoryHits.set(id, hits);
      return { success: false, retryAfterSeconds: Math.ceil((hits[0] - windowStart) / 1000) };
    }
    hits.push(now);
    memoryHits.set(id, hits);
    return { success: true, retryAfterSeconds: 0 };
  };

  const check = async (clientId: string): Promise<RateLimitResult> => {
    const redis = getRedis();
    if (!redis) return memoryLimit(clientId);

    upstash ??= new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `sitepulse:ratelimit:${name}`,
    });

    try {
      const { success, reset } = await upstash.limit(clientId);
      return { success, retryAfterSeconds: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
    } catch (error) {
      // Fail open: a Redis outage shouldn't take the feature down with it.
      console.error(`Rate limiter "${name}" failed, allowing request:`, error);
      return { success: true, retryAfterSeconds: 0 };
    }
  };

  return { check, reset: () => memoryHits.clear() };
};

// Fresh analyses per client IP. Cached results don't count, so re-opening a report is free.
export const ANALYZE_LIMIT = 10;
const analyzeLimiter = createLimiter("analyze", ANALYZE_LIMIT, 10 * 60);
export const limitAnalyze = analyzeLimiter.check;

// AI calls (insights + chat turns) cost real money per request; cap them separately.
export const AI_LIMIT = 30;
const aiLimiter = createLimiter("ai", AI_LIMIT, 10 * 60);
export const limitAi = aiLimiter.check;

// Vercel and most proxies put the client first in x-forwarded-for.
export const clientIdFrom = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";

// Exposed for tests only.
export const __resetMemoryRateLimit = () => {
  analyzeLimiter.reset();
  aiLimiter.reset();
};
