/** @jest-environment node */
import { POST as analyzePOST } from "@/app/api/analyze/route";
import { POST as enrichPOST } from "@/app/api/analyze/enrich/route";
import { ANALYZE_LIMIT, __resetMemoryRateLimit } from "@/server/rateLimit";
import { transformPageSpeed } from "@/lib/transformPageSpeed";
import { json, makeReport, mockFetch, psi } from "./helpers";

const post = (handler: (req: Request) => Promise<Response>, body: unknown, ip = "203.0.113.50") =>
  handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

let counter = 0;
const pagespeedFor = (host = `browser-${++counter}.example.com`) =>
  transformPageSpeed(psi, `https://${host}/`, "mobile");

beforeEach(() => {
  process.env.GOOGLE_PAGESPEED_API_KEY = "server-key";
  __resetMemoryRateLimit();
});
afterEach(() => jest.restoreAllMocks());

describe("POST /api/analyze/enrich", () => {
  test("adds CrUX history and Observatory to a browser-run PageSpeed report", async () => {
    const fetchSpy = mockFetch({});
    const res = await post(enrichPOST, { pagespeed: pagespeedFor(), pagespeedMs: 98_000 });
    const report = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("BYPASS");
    expect(report.security.grade).toBe("A+");
    expect(report.fieldHistory.weeks.length).toBeGreaterThan(0);
    expect(report.sources.pagespeed).toEqual({ status: "ok", message: null, ms: 98_000 });
    // PageSpeed already ran in the browser: the server must not call it again.
    expect(fetchSpy.mock.calls.some(([u]) => String(u).includes("pagespeedonline"))).toBe(false);
  });

  test("never writes client-supplied reports to the shared cache", async () => {
    const fetchSpy = mockFetch({});
    const pagespeed = pagespeedFor();
    // A fabricated score from the client...
    await post(enrichPOST, { pagespeed: { ...pagespeed, categories: { ...pagespeed.categories, performance: 100 } } });

    // ...must not be what the next visitor gets for that URL.
    const res = await post(analyzePOST, { url: pagespeed.url }, "198.51.100.77");
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(fetchSpy.mock.calls.some(([u]) => String(u).includes("pagespeedonline"))).toBe(true);
  });

  test("rejects private or non-normalized URLs, invalid bodies and oversized payloads", async () => {
    mockFetch({});
    expect((await post(enrichPOST, { pagespeed: pagespeedFor("localhost") })).status).toBe(400);
    expect((await post(enrichPOST, { pagespeed: { ...pagespeedFor(), url: "HTTPS://Example.com" } })).status).toBe(400);
    expect((await post(enrichPOST, { pagespeed: { url: "https://example.com/" } })).status).toBe(400);
    expect((await post(enrichPOST, "not json")).status).toBe(400);
    expect((await post(enrichPOST, JSON.stringify({ pad: "x".repeat(600 * 1024) }))).status).toBe(413);
  });

  test("counts against the same audit rate limit as the server path", async () => {
    mockFetch({});
    for (let i = 0; i < ANALYZE_LIMIT; i++) {
      expect((await post(enrichPOST, { pagespeed: pagespeedFor() })).status).toBe(200);
    }
    expect((await post(enrichPOST, { pagespeed: pagespeedFor() })).status).toBe(429);
  });
});

describe("requestReport (browser client)", () => {
  // NEXT_PUBLIC_* is read when the module loads, so import it fresh per configuration.
  const loadClient = async (browserKey: string | undefined) => {
    if (browserKey) process.env.NEXT_PUBLIC_PSI_BROWSER_KEY = browserKey;
    else delete process.env.NEXT_PUBLIC_PSI_BROWSER_KEY;
    let mod!: typeof import("@/lib/clientAnalysis");
    await jest.isolateModulesAsync(async () => {
      mod = await import("@/lib/clientAnalysis");
    });
    return mod;
  };

  test("with a browser key: runs PageSpeed directly, then enriches on the server", async () => {
    const { requestReport, usesBrowserPageSpeed } = await loadClient("browser-key");
    const calls: string[] = [];
    let enrichBody: { pagespeed: { url: string; strategy: string }; pagespeedMs: number } | undefined;
    jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("pagespeedonline")) return json(psi);
      if (url === "/api/analyze/enrich") {
        enrichBody = JSON.parse(String(init!.body));
        return post(enrichPOST, enrichBody);
      }
      if (url.includes("chromeuxreport")) return json({ error: {} }, 404);
      if (url.includes("observatory")) return json({}, 502);
      throw new Error(`Unexpected fetch ${url}`);
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { report, cached } = await requestReport("  example.org ", "desktop");

    expect(usesBrowserPageSpeed()).toBe(true);
    const psiCall = new URL(calls.find((u) => u.includes("pagespeedonline"))!);
    expect(psiCall.searchParams.get("key")).toBe("browser-key");
    expect(psiCall.searchParams.get("url")).toBe("https://example.org/");
    expect(psiCall.searchParams.get("strategy")).toBe("desktop");
    expect(enrichBody!.pagespeed).toMatchObject({ url: "https://example.org/", strategy: "desktop" });
    expect(typeof enrichBody!.pagespeedMs).toBe("number");
    expect(calls).not.toContain("/api/analyze");
    expect(report.url).toBe("https://example.org/");
    expect(cached).toBe(false);
  });

  test("PageSpeed errors in the browser surface as ReportRequestErrors with a status", async () => {
    const { requestReport, ReportRequestError } = await loadClient("browser-key");
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(global, "fetch").mockResolvedValue(json({ error: { message: "Lighthouse returned error" } }, 400));

    const error = await requestReport("example.org", "mobile").catch((e) => e);
    expect(error).toBeInstanceOf(ReportRequestError);
    expect(error.status).toBe(400);
  });

  test("bad URLs fail fast in the browser without calling anything", async () => {
    const { requestReport } = await loadClient("browser-key");
    const fetchSpy = jest.spyOn(global, "fetch");
    await expect(requestReport("http://localhost:3000", "mobile")).rejects.toMatchObject({ status: 400 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("without a browser key: falls back to the server path (with cache flag)", async () => {
    const { requestReport, usesBrowserPageSpeed } = await loadClient(undefined);
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(makeReport()), { status: 200, headers: { "X-Cache": "HIT" } }));

    const { cached } = await requestReport("example.org", "mobile", true);

    expect(usesBrowserPageSpeed()).toBe(false);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/analyze");
    expect(JSON.parse(String(init!.body))).toEqual({ url: "example.org", strategy: "mobile", refresh: true });
    expect(cached).toBe(true);
  });
});
