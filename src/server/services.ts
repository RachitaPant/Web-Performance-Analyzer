import { InsightsResponseSchema, type InsightsResponse } from "@/lib/insights";
import type { Report, Strategy } from "@/lib/report";
import { resolveLlmConfig } from "./ai/config";
import { generateInsights } from "./ai/insights";
import { AiError } from "./ai/llm";
import { analyze } from "./analyze";
import { cacheGet, cacheSet, hashKey } from "./kvCache";
import { normalizeUrl } from "./pagespeed";
import { limitAi, limitAnalyze } from "./rateLimit";
import { getCachedReport, reportCacheKey, setCachedReport } from "./reportCache";

// Cache → rate limit → work → cache, shared by the HTTP routes and the MCP server.

export class RateLimitedError extends Error {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitedError";
  }
}

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

// Server-side audit with the shared report cache. Cache hits don't count against the limit.
export const getReport = async (
  input: string,
  strategy: Strategy,
  clientId: string,
  refresh = false
): Promise<{ report: Report; cached: boolean }> => {
  const url = normalizeUrl(input);
  const key = reportCacheKey(url, strategy);

  if (!refresh) {
    const cached = await getCachedReport(key);
    if (cached) return { report: cached, cached: true };
  }

  const limit = await limitAnalyze(clientId);
  if (!limit.success) {
    throw new RateLimitedError(
      `You've reached the limit for new audits. Try again in about ${minutes(limit.retryAfterSeconds)} min — recently analyzed URLs still load instantly.`,
      limit.retryAfterSeconds
    );
  }

  const report = await analyze(url, strategy);
  await setCachedReport(key, report);
  return { report, cached: false };
};

// Bump when the prompt or output schema changes so cached insights are regenerated.
const INSIGHTS_VERSION = "v1";
const INSIGHTS_CACHE_TTL_SECONDS = 24 * 60 * 60;

// The same report (url + device + run time) on the same model always gets the same insights.
export const getInsights = async (
  report: Report,
  clientId: string
): Promise<{ insights: InsightsResponse; cached: boolean }> => {
  const llm = resolveLlmConfig();
  if (!llm) throw new AiError(503, "AI features aren't configured on this deployment yet.");

  const key = `sitepulse:insights:${INSIGHTS_VERSION}:${hashKey(llm.provider, llm.models[0], report.url, report.strategy, report.fetchedAt)}`;
  const cached = await cacheGet(key, InsightsResponseSchema);
  if (cached) return { insights: cached, cached: true };

  const limit = await limitAi(clientId);
  if (!limit.success) {
    throw new RateLimitedError("You've reached the limit for AI requests. Please try again in a few minutes.", limit.retryAfterSeconds);
  }

  const insights = await generateInsights(report);
  await cacheSet(key, insights, INSIGHTS_CACHE_TTL_SECONDS);
  return { insights, cached: false };
};
