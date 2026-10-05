/** @jest-environment node */
import { ReportSchema } from "@/lib/report";
import { analyze } from "@/server/analyze";
import { transformCruxHistory } from "@/server/cruxHistory";
import { AnalysisError } from "@/server/pagespeed";
import { cruxRecord, json, mockFetch } from "./helpers";

const URL = "https://web.dev/";

beforeEach(() => {
  process.env.GOOGLE_PAGESPEED_API_KEY = "test-key";
});
afterEach(() => jest.restoreAllMocks());

describe("transformCruxHistory", () => {
  test("maps collection periods to weekly p75s, de-stringing CLS and nulling gaps", () => {
    expect(transformCruxHistory(cruxRecord)).toEqual([
      { end: "2026-09-05", lcp: 3400, inp: 240, cls: 0.03 },
      { end: "2026-09-12", lcp: 3310, inp: 231, cls: 0.02 },
      { end: "2026-09-19", lcp: null, inp: 225, cls: null },
      { end: "2026-09-26", lcp: 3133, inp: 218, cls: 0.01 },
    ]);
  });
});

describe("analyze", () => {
  test("merges all sources into a valid report", async () => {
    mockFetch({});
    const report = await analyze(URL, "mobile");

    expect(() => ReportSchema.parse(report)).not.toThrow();
    expect(report.fieldHistory?.scope).toBe("url");
    expect(report.security?.grade).toBe("A+");
    expect(Object.values(report.sources).map((s) => s.status)).toEqual(["ok", "ok", "ok"]);
  });

  test("CrUX API not enabled → report still ships, source marked unavailable", async () => {
    mockFetch({ crux: () => json({ error: { code: 403 } }, 403) });
    const report = await analyze(URL, "mobile");

    expect(report.fieldHistory).toBeNull();
    expect(report.sources.cruxHistory.status).toBe("unavailable");
    expect(report.sources.cruxHistory.message).toMatch(/isn't enabled/);
    expect(report.categories.performance).toBe(53);
  });

  test("falls back to origin-level CrUX history when the URL has none", async () => {
    const bodies: string[] = [];
    mockFetch({
      crux: (_url, init) => {
        bodies.push(String(init?.body));
        return bodies.length === 1 ? json({ error: { code: 404 } }, 404) : json({ record: cruxRecord });
      },
    });
    const report = await analyze(URL, "desktop");

    expect(report.fieldHistory?.scope).toBe("origin");
    expect(JSON.parse(bodies[1])).toMatchObject({ origin: "https://web.dev", formFactor: "DESKTOP" });
  });

  test("an Observatory crash degrades to an error status, not a failed analysis", async () => {
    mockFetch({ observatory: () => json({}, 502) });
    const report = await analyze(URL, "mobile");

    expect(report.security).toBeNull();
    expect(report.sources.observatory).toMatchObject({ status: "error", message: "Temporarily unavailable." });
  });

  test("PageSpeed is required: its failure fails the analysis", async () => {
    mockFetch({ psi: () => json({ error: { message: "Lighthouse returned error" } }, 500) });
    await expect(analyze(URL, "mobile")).rejects.toBeInstanceOf(AnalysisError);
  });
});
