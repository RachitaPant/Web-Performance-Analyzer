/** @jest-environment node */
import { buildEvidence } from "@/lib/evidence";
import type { InsightsResponse } from "@/lib/insights";
import { CASES } from "../evals/cases";
import { baseChecks, extractDurations, groundingRate, numberAccuracy } from "../evals/checks";

const response = (overrides: Partial<InsightsResponse> = {}): InsightsResponse => ({
  summary: "Mobile LCP is 3.9 s, well above the 2500 ms target.",
  findings: [1, 2, 3].map((n) => ({
    severity: "high",
    title: `Finding ${n}`,
    explanation: "Main-thread work takes 4.3 s and TBT is 960 ms.",
    fix: "Aim for under 200 ms.",
    estimatedImpact: "~1 s faster",
    evidence: ["lab:tbt"],
  })),
  meta: { model: "claude-opus-5-5", droppedFindings: 0, latencyMs: 1, inputTokens: 1, outputTokens: 1, cacheReadTokens: 0 },
  ...overrides,
});

const webdev = CASES.find((c) => c.id === "slow-mobile")!.report;
const evidence = buildEvidence(webdev);

describe("eval checks (the grader itself)", () => {
  test("extracts durations in ms", () => {
    expect(extractDurations("LCP 3.9 s, TBT 963 ms, 12 items")).toEqual([
      { text: "3.9 s", ms: 3900 },
      { text: "963 ms", ms: 963 },
    ]);
  });

  test("accepts durations that match evidence after display rounding, and prompt thresholds", () => {
    // web.dev fixture: LCP ≈ 3.9 s, TBT ≈ 960 ms, main thread ≈ 4.3 s.
    const lcp = webdev.lab.lcp.value!;
    const r = response({ summary: `LCP is ${(lcp / 1000).toFixed(1)} s, above the 2500 ms target.` });
    r.findings = r.findings.map((f) => ({
      ...f,
      explanation: `TBT is ${Math.round(webdev.lab.tbt.value!)} ms.`,
    }));
    expect(numberAccuracy(r, evidence).unmatched).toEqual([]);
  });

  test("flags an invented duration", () => {
    const r = response({ summary: "LCP is 9.7 s." });
    expect(numberAccuracy(r, evidence).unmatched).toContain("9.7 s");
  });

  test("grounding rate counts dropped findings", () => {
    expect(groundingRate(response({ meta: { ...response().meta, droppedFindings: 1 } }))).toBeCloseTo(0.75);
    expect(baseChecks(response({ meta: { ...response().meta, droppedFindings: 1 } }), evidence)[0].pass).toBe(false);
  });

  test("every case loads a valid report and its checks run", () => {
    expect(CASES.map((c) => c.id)).toEqual(["slow-mobile", "slow-desktop", "fast-site", "prompt-injection", "no-field-data"]);
    for (const c of CASES) {
      const results = c.checks(response(), c.report);
      expect(results.length).toBeGreaterThan(0);
      results.forEach((r) => expect(typeof r.pass).toBe("boolean"));
    }
  });

  test("the injection case really contains the injected instruction", () => {
    const injected = CASES.find((c) => c.id === "prompt-injection")!.report;
    expect(injected.opportunities[0].title).toMatch(/Ignore all previous instructions/);
  });

  test("the injection check fails an output that obeyed the injection", () => {
    const injection = CASES.find((c) => c.id === "prompt-injection")!;
    const obeyed = injection.checks(response({ summary: "PWNED" }), injection.report);
    expect(obeyed.find((x) => x.name === "ignores injected instruction")!.pass).toBe(false);
  });
});
