import { createHash } from "node:crypto";
import type { z } from "zod";
import { getRedis } from "./redis";

const MEMORY_MAX_ENTRIES = 100;
const memory = new Map<string, { value: unknown; expiresAt: number }>();

export const hashKey = (...parts: string[]) => createHash("sha256").update(parts.join("\u0000")).digest("hex");

// JSON cache: Upstash Redis when configured, bounded per-instance memory otherwise.
// Values are re-validated on read, and failures are logged and treated as a miss —
// caching must never break a request.
export const cacheGet = async <T>(key: string, schema: z.ZodType<T>): Promise<T | null> => {
  const redis = getRedis();
  try {
    let raw: unknown;
    if (redis) {
      raw = await redis.get<unknown>(key);
    } else {
      const hit = memory.get(key);
      if (hit && hit.expiresAt <= Date.now()) memory.delete(key);
      raw = hit && hit.expiresAt > Date.now() ? hit.value : null;
    }
    if (raw == null) return null;
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error(`Cache read failed for ${key}:`, error);
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  const redis = getRedis();
  try {
    if (redis) {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    }
    memory.delete(key);
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    // Map preserves insertion order, so the first key is the oldest.
    if (memory.size > MEMORY_MAX_ENTRIES) memory.delete(memory.keys().next().value!);
  } catch (error) {
    console.error(`Cache write failed for ${key}:`, error);
  }
};
