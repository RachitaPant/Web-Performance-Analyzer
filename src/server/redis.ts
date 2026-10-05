import { Redis } from "@upstash/redis";

// Upstash is optional: set UPSTASH_REDIS_REST_URL/TOKEN (or Vercel's KV_REST_API_URL/TOKEN)
// to share cache + rate-limit state across serverless instances. Without it, both fall back
// to per-instance memory — fine for local dev, best-effort in production.
let client: Redis | null | undefined;

export const getRedis = (): Redis | null => {
  if (client === undefined) {
    const configured =
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    client = configured ? Redis.fromEnv() : null;
  }
  return client;
};
