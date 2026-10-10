/** @jest-environment node */
import fixture from "./fixtures/psi-webdev-mobile.json";
import { ReportSchema } from "@/lib/report";
import { transformPageSpeed, type PsiResponse } from "@/server/transformPageSpeed";

// Fixture: real PSI v5 response for https://web.dev/ (mobile, Lighthouse 13.5), trimmed.
const psi = fixture as unknown as PsiResponse;
const report = transformPageSpeed(psi, "https://web.dev/", "mobile");

describe("transformPageSpeed", () => {
  test("produces the PageSpeed part of a valid Report", () => {
    const schema = ReportSchema.omit({ fieldHistory: true, security: true, sources: true });
    expect(() => schema.parse(report)).not.toThrow();
  });

  test("maps category scores to 0–100", () => {
    expect(report.categories).toEqual({
      performance: 53,
      accessibility: 90,
      bestPractices: 96,
      seo: 92,
    });
  });

  test("reads CLS from the real cumulative-layout-shift audit", () => {
    expect(report.lab.cls.value).toBeCloseTo(0.1185, 3);
    expect(report.lab.cls.score).toBe(0.85);
  });

  test("uses TBT (not the retired FID) as the lab interactivity metric", () => {
    expect(report.lab.tbt.value).toBe(963);
    expect(report.lab).not.toHaveProperty("fid");
  });

  test("uses URL-level CrUX field data with INP and de-scaled CLS", () => {
    expect(report.field?.scope).toBe("url");
    expect(report.field?.inp).toEqual({ p75: 218, rating: "needs-improvement" });
    expect(report.field?.cls).toEqual({ p75: 0.01, rating: "good" });
  });

  test("falls back to origin-level field data when URL data is missing", () => {
    const r = transformPageSpeed(
      { ...psi, loadingExperience: { origin_fallback: true } },
      "https://web.dev/",
      "mobile"
    );
    expect(r.field?.scope).toBe("origin");
  });

  test("returns null field data when CrUX has nothing", () => {
    const r = transformPageSpeed(
      { ...psi, loadingExperience: undefined, originLoadingExperience: undefined },
      "https://web.dev/",
      "mobile"
    );
    expect(r.field).toBeNull();
  });

  test("reads Lighthouse 13 diagnostics (insight audits + resource summary)", () => {
    expect(report.diagnostics.domSize).toBe(838);
    expect(report.diagnostics.requestCount).toBe(88);
    expect(report.diagnostics.thirdPartyRequests).toBe(80);
    expect(report.diagnostics.resources.map((r) => r.type)).not.toContain("total");
    expect(report.diagnostics.thirdParties[0].entity).toBe("Google CDN");
  });

  test("ranks failing opportunities by estimated time savings", () => {
    const ids = report.opportunities.map((o) => o.id);
    expect(ids[0]).toBe("render-blocking-insight");
    expect(report.opportunities[0].savingsMs).toBe(2300);
    expect(report.opportunities.every((o) => (o.score ?? 0) < 0.9)).toBe(true);
    const savings = report.opportunities.map((o) => o.savingsMs);
    expect(savings).toEqual([...savings].sort((a, b) => b - a));
  });
});
