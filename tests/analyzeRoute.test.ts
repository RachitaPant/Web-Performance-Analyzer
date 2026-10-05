/** @jest-environment node */
import { POST } from "@/app/api/analyze/route";
import { ANALYZE_LIMIT, __resetMemoryRateLimit } from "@/server/rateLimit";
import { mockFetch } from "./helpers";

// No Upstash env vars in tests, so cache + rate limit use the in-memory fallbacks.
const post = (body: unknown, ip = "203.0.113.7") =>
  POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    })
  );

let siteCounter = 0;
const freshSite = () => `site-${++siteCounter}.example.com`;

beforeEach(() => {
  process.env.GOOGLE_PAGESPEED_API_KEY = "test-key";
  __resetMemoryRateLimit();
});
afterEach(() => jest.restoreAllMocks());

const psiCalls = (spy: jest.SpyInstance) =>
  spy.mock.calls.filter(([u]) => String(u).includes("pagespeedonline")).length;

describe("POST /api/analyze", () => {
  test("serves a repeat request from cache without calling PageSpeed again", async () => {
    const fetchSpy = mockFetch({});
    const site = freshSite();

    const first = await post({ url: site });
    const second = await post({ url: site });

    expect(first.headers.get("X-Cache")).toBe("MISS");
    expect(second.headers.get("X-Cache")).toBe("HIT");
    expect(await second.json()).toMatchObject({ url: `https://${site}/` });
    expect(psiCalls(fetchSpy)).toBe(1);
  });

  test("cache is per device strategy, and refresh bypasses it", async () => {
    const fetchSpy = mockFetch({});
    const site = freshSite();

    await post({ url: site, strategy: "mobile" });
    expect((await post({ url: site, strategy: "desktop" })).headers.get("X-Cache")).toBe("MISS");
    expect((await post({ url: site, strategy: "mobile", refresh: true })).headers.get("X-Cache")).toBe("MISS");
    expect(psiCalls(fetchSpy)).toBe(3);
  });

  test(`rate-limits fresh analyses after ${ANALYZE_LIMIT} per window, per client`, async () => {
    mockFetch({});
    for (let i = 0; i < ANALYZE_LIMIT; i++) {
      expect((await post({ url: freshSite() })).status).toBe(200);
    }

    const blocked = await post({ url: freshSite() });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await blocked.json()).retryAfterSeconds).toBeGreaterThan(0);

    // Another client is unaffected.
    expect((await post({ url: freshSite() }, "198.51.100.1")).status).toBe(200);
  });

  test("cached reports are still served while rate-limited", async () => {
    mockFetch({});
    const site = freshSite();
    await post({ url: site });
    for (let i = 1; i < ANALYZE_LIMIT; i++) await post({ url: freshSite() });

    expect((await post({ url: freshSite() })).status).toBe(429);
    expect((await post({ url: site })).status).toBe(200);
  });
});
