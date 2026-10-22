/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { classifyChangedFiles } from "@/ci/changedFiles";
import { compareReports, evaluateBudgets, BudgetConfigSchema } from "@/ci/budget";
import { renderCiComment, verdict, type CiSummary } from "@/ci/ciComment";
import { makeReport } from "./helpers";

describe("classifyChangedFiles", () => {
  test("docs, CI, tests, evals, budgets and CI-only code are not runtime changes", () => {
    const c = classifyChangedFiles([
      "README.md",
      ".github/workflows/sitepulse.yml",
      "tests/budget.test.ts",
      "evals/cases.ts",
      ".sitepulse/budget.json",
      "src/ci/budget.ts",
      "scripts/sitepulse-ci.ts",
      "",
    ]);
    expect(c).toEqual({ runtime: [], other: expect.any(Array), total: 7 });
  });

  test("anything else counts as a runtime change (fail-safe)", () => {
    const c = classifyChangedFiles(["src/components/Form/page.tsx", "package.json", "next.config.ts", "public/logo.svg", "docs/x.md"]);
    expect(c.runtime).toEqual(["src/components/Form/page.tsx", "package.json", "next.config.ts", "public/logo.svg"]);
  });
});

// The classification above is only true if the app never imports src/ci.
test("no app code imports src/ci", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(tsx?|mts)$/.test(name) && /["']@\/ci\/|["']\.\.?\/(\.\.\/)*ci\//.test(readFileSync(path, "utf8"))) offenders.push(path);
    }
  };
  ["src/app", "src/components", "src/lib", "src/server"].forEach(walk);
  expect(offenders).toEqual([]);
});

describe("informational verdict for non-runtime PRs", () => {
  const report = makeReport(); // performance 53: breaks a 90 budget
  const config = BudgetConfigSchema.parse({});
  const summaryWith = (files: string[] | null): CiSummary => ({
    pages: [
      {
        path: "/",
        strategy: "mobile",
        head: report,
        base: report,
        budgetChecks: evaluateBudgets(report, { performance: 90 }),
        comparison: compareReports(report, report, config.regression),
        ai: null,
      },
    ],
    failOnRegression: false,
    headLabel: "this PR (preview)",
    baseLabel: "production",
    changes: files ? classifyChangedFiles(files) : null,
  });

  test("a docs/CI-only PR reports the broken budget but does not fail", () => {
    const summary = summaryWith(["README.md", ".github/workflows/sitepulse.yml"]);
    expect(verdict(summary)).toMatchObject({ budgetFailed: true, failed: false, informational: true });
    expect(renderCiComment(summary)).toContain("ℹ️ **No app code changed**");
  });

  test("an app change, or unknown changes, still fails on a broken budget", () => {
    expect(verdict(summaryWith(["src/components/Form/page.tsx"])).failed).toBe(true);
    expect(verdict(summaryWith(null)).failed).toBe(true);
    expect(verdict(summaryWith([])).failed).toBe(true); // empty diff isn't evidence of "no app change"
  });
});
