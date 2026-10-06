// Runs the AI insights eval against real Claude calls. Costs money: see evals/README.md.
//   npm run eval                 # all cases
//   npm run eval -- fast-site    # one case by id
import { mkdirSync, writeFileSync } from "node:fs";
import { buildEvidence } from "@/lib/evidence";
import { generateInsights } from "@/server/ai/insights";
import type { InsightsResponse } from "@/lib/insights";
import { baseChecks, groundingRate, type CheckResult } from "./checks";
import { CASES } from "./cases";

type CaseResult = { id: string; description: string } & (
  | { checks: CheckResult[]; groundingRate: number; insights: InsightsResponse }
  | { error: string }
);

// Claude Opus 5.5 list prices, USD per million tokens.
const PRICE = { input: 4, output: 20, cacheRead: 0.2 };

const main = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set (add it to .env.local).");
    process.exit(2);
  }

  const only = process.argv.slice(2);
  const cases = only.length ? CASES.filter((c) => only.includes(c.id)) : CASES;
  const results: CaseResult[] = [];
  let cost = 0;

  for (const c of cases) {
    process.stdout.write(`▶ ${c.id} … `);
    try {
      const r = await generateInsights(c.report);
      const checks: CheckResult[] = [...baseChecks(r, buildEvidence(c.report)), ...c.checks(r, c.report)];
      const caseCost =
        ((r.meta.inputTokens - r.meta.cacheReadTokens) * PRICE.input +
          r.meta.cacheReadTokens * PRICE.cacheRead +
          r.meta.outputTokens * PRICE.output) /
        1e6;
      cost += caseCost;
      const passed = checks.filter((x) => x.pass).length;
      console.log(`${passed}/${checks.length} checks · ${(r.meta.latencyMs / 1000).toFixed(1)} s · $${caseCost.toFixed(3)}`);
      checks.filter((x) => !x.pass).forEach((x) => console.log(`    ✗ ${x.name}: ${x.detail}`));
      results.push({ id: c.id, description: c.description, checks, groundingRate: groundingRate(r), insights: r });
    } catch (error) {
      console.log(`ERROR: ${error instanceof Error ? error.message : error}`);
      results.push({ id: c.id, description: c.description, error: String(error) });
    }
  }

  const allChecks = results.flatMap((r) => ("checks" in r ? r.checks : []));
  const passed = allChecks.filter((c) => c.pass).length;
  const errored = results.filter((r) => "error" in r).length;
  const grounding = results.flatMap((r) => ("groundingRate" in r ? [r.groundingRate] : []));
  const summary = {
    ranAt: new Date().toISOString(),
    cases: results.length,
    errored,
    checksPassed: passed,
    checksTotal: allChecks.length,
    meanGroundingRate: grounding.length ? grounding.reduce((a, b) => a + b, 0) / grounding.length : null,
    costUsd: Number(cost.toFixed(4)),
  };

  mkdirSync("evals/results", { recursive: true });
  const file = `evals/results/${summary.ranAt.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({ summary, results }, null, 2));

  console.log(`\n${passed}/${allChecks.length} checks passed across ${results.length} cases` + (errored ? ` (${errored} errored)` : ""));
  console.log(`Mean grounding rate: ${summary.meanGroundingRate == null ? "n/a" : `${Math.round(summary.meanGroundingRate * 100)}%`}`);
  console.log(`Total cost: $${summary.costUsd.toFixed(3)}  ·  details: ${file}`);
  process.exit(passed === allChecks.length && errored === 0 ? 0 : 1);
};

main();
