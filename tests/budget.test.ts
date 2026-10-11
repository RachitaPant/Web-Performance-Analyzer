/** @jest-environment node */
import { readFileSync } from "node:fs";
import { BudgetConfigSchema, compareReports, evaluateBudgets, pickMedianRun } from "@/ci/budget";
import { CI_COMMENT_MARKER, renderCiComment, verdict, type CiSummary } from "@/ci/ciComment";
import type { Report } from "@/lib/report";
import { makeReport } from "./helpers";

// web.dev fixture: performance 53, LCP ≈ 3.9 s, TBT 963 ms, CLS 0.119, ~3.5 MB.
const slow = makeReport();
const fast: Report = {
  ...slow,
  categories: { ...slow.categories, performance: 98 },
  lab: {
    ...slow.lab,
    lcp: { ...slow.lab.lcp, value: 1200 },
    tbt: { ...slow.lab.tbt, value: 0 },
    cls: { ...slow.lab.cls, value: 0.01 },
    fcp: { ...slow.lab.fcp, value: 900 },
  },
  diagnostics: { ...slow.diagnostics, totalBytes: 2_000 },
  opportunities: slow.opportunities.slice(2),
};
const defaults = BudgetConfigSchema.parse({});

describe("budget config", () => {
  test("defaults to auditing / on mobile with no hard budgets and warn-only regressions", () => {
    expect(defaults).toEqual({
      runs: 3,
      pages: [{ path: "/", strategy: "mobile" }],
      budgets: {},
      regression: { performancePoints: 5, timingPercent: 20, failOnRegression: false },
    });
  });

  test("the project's own .sitepulse/budget.json is valid", () => {
    const parsed = BudgetConfigSchema.safeParse(JSON.parse(readFileSync(".sitepulse/budget.json", "utf8")));
    expect(parsed.success).toBe(true);
  });

  test("rejects paths without a leading slash and out-of-range scores", () => {
    expect(BudgetConfigSchema.safeParse({ pages: [{ path: "login" }] }).success).toBe(false);
    expect(BudgetConfigSchema.safeParse({ budgets: { performance: 120 } }).success).toBe(false);
  });
});

describe("pickMedianRun", () => {
  const run = (performance: number | null, tag: string) => ({ categories: { performance }, tag });
  test("returns the whole run with the median score", () => {
    expect(pickMedianRun([run(97, "a"), run(67, "b"), run(95, "c")]).tag).toBe("c");
    expect(pickMedianRun([run(80, "only")]).tag).toBe("only");
  });
  test("with an even count, picks the lower middle (the conservative choice for a gate)", () => {
    expect(pickMedianRun([run(90, "a"), run(70, "b"), run(80, "c"), run(60, "d")]).tag).toBe("b");
  });
  test("an unscored run sorts lowest", () => {
    expect(pickMedianRun([run(null, "x"), run(90, "a"), run(95, "b")]).tag).toBe("a");
  });
});

describe("evaluateBudgets", () => {
  test("checks score as a minimum and timings/bytes as maximums", () => {
    const checks = evaluateBudgets(slow, { performance: 50, lcpMs: 3000, cls: 0.2, totalBytes: 5_000_000 });
    expect(checks.map((c) => [c.key, c.pass])).toEqual([
      ["performance", true],
      ["lcpMs", false],
      ["cls", true],
      ["totalBytes", true],
    ]);
  });

  test("an unmeasured metric fails its budget", () => {
    const unmeasured = { ...slow, lab: { ...slow.lab, tbt: { value: null, displayValue: null, score: null } } };
    expect(evaluateBudgets(unmeasured, { tbtMs: 300 })[0]).toMatchObject({ actual: null, pass: false });
  });
});

describe("compareReports", () => {
  test("flags real regressions and new opportunities", () => {
    const { deltas, opportunityChanges, regressed } = compareReports(fast, slow, defaults.regression);
    expect(regressed).toBe(true);
    expect(deltas.find((d) => d.key === "performance")).toMatchObject({ base: 98, head: 53, regressed: true });
    expect(deltas.find((d) => d.key === "lcpMs")!.regressed).toBe(true);
    expect(opportunityChanges.map((c) => c.status)).toEqual(["new", "new"]);
  });

  test("tolerates lab noise below the thresholds", () => {
    const noisy: Report = {
      ...slow,
      categories: { ...slow.categories, performance: 50 }, // -3 pts
      lab: { ...slow.lab, lcp: { ...slow.lab.lcp, value: slow.lab.lcp.value! * 1.1 } }, // +10%
    };
    expect(compareReports(slow, noisy, defaults.regression).regressed).toBe(false);
  });

  test("an improvement is never a regression", () => {
    expect(compareReports(slow, fast, defaults.regression).regressed).toBe(false);
  });

  test("an opportunity counts as worse only past the noise floor", () => {
    const worse = { ...slow, opportunities: slow.opportunities.map((o, i) => (i === 0 ? { ...o, savingsMs: o.savingsMs + 500 } : o)) };
    const slightly = { ...slow, opportunities: slow.opportunities.map((o, i) => (i === 0 ? { ...o, savingsMs: o.savingsMs + 50 } : o)) };
    expect(compareReports(slow, worse, defaults.regression).opportunityChanges).toEqual([
      expect.objectContaining({ id: slow.opportunities[0].id, status: "worse" }),
    ]);
    expect(compareReports(slow, slightly, defaults.regression).opportunityChanges).toEqual([]);
  });
});

describe("renderCiComment", () => {
  const summaryFor = (head: Report, base: Report | null, failOnRegression = false): CiSummary => ({
    pages: [
      {
        path: "/",
        strategy: "mobile",
        head,
        base,
        budgetChecks: evaluateBudgets(head, { performance: 90, lcpMs: 3500 }),
        comparison: base ? compareReports(base, head, defaults.regression) : null,
        ai: null,
      },
    ],
    failOnRegression,
    headLabel: "this PR",
    baseLabel: "production",
  });

  test("a failing PR gets a ❌ headline, a comparison table and readable changes", () => {
    const md = renderCiComment(summaryFor(slow, fast));
    expect(md.startsWith(CI_COMMENT_MARKER)).toBe(true);
    expect(md).toContain("❌ **Performance budget exceeded**");
    expect(md).toContain("| Metric | Budget | production | this PR | Change |");
    expect(md).toContain("| Performance score | ≥ 90 ❌ | 98 | 53 ⚠️ | -45 pts |");
    expect(md).toContain("| TBT | – | 0 ms | 963 ms | +963 ms |"); // zero baseline: absolute change
    expect(md).toContain("×1,"); // 2 KB -> 3.5 MB: a ratio, not "+176000%"
    expect(md).toContain("🆕 Render-blocking requests");
  });

  test("without a baseline it shows budgets only", () => {
    const md = renderCiComment(summaryFor(fast, null));
    expect(md).toContain("✅ **All performance budgets met**");
    expect(md).toContain("| Metric | Budget | this PR |");
  });

  test("regressions warn by default and fail only when configured", () => {
    const withinBudget: Report = { ...slow, categories: { ...slow.categories, performance: 92 }, lab: fast.lab };
    const base: Report = { ...fast, categories: { ...fast.categories, performance: 99 } };
    expect(verdict(summaryFor(withinBudget, base))).toMatchObject({ budgetFailed: false, regressed: true, failed: false });
    expect(renderCiComment(summaryFor(withinBudget, base))).toContain("⚠️ **Possible regression**");
    expect(verdict(summaryFor(withinBudget, base, true)).failed).toBe(true);
  });
});
