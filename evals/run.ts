// Runs the AI insights eval against real model calls via the configured provider (see evals/README.md).
//   npm run eval                 # all cases
//   npm run eval -- fast-site    # one case by id
//   npm run eval -- --allow-fallback   # let rate-limited calls fall back to AI_FALLBACK_MODELS
// By default the eval pins the primary model so runs are comparable, and waits out
// per-minute rate limits (free tiers) instead of switching models.
import { mkdirSync, writeFileSync } from "node:fs";
import { buildEvidence } from "@/lib/evidence";
import { generateInsights } from "@/server/ai/insights";
import { resolveLlmConfig } from "@/server/ai/config";
import { AiError } from "@/server/ai/llm";
import type { InsightsResponse } from "@/lib/insights";
import { baseChecks, groundingRate, type CheckResult } from "./checks";
import { CASES } from "./cases";

type CaseResult = { id: string; description: string } & (
  | { checks: CheckResult[]; groundingRate: number; insights: InsightsResponse }
  | { error: string }
);

// Optional USD-per-million-token prices for cost reporting; free tiers leave these unset (= $0).
const PRICE = {
  input: Number(process.env.AI_PRICE_INPUT_PER_M ?? 0),
  output: Number(process.env.AI_PRICE_OUTPUT_PER_M ?? 0),
};

const RATE_LIMIT_WAIT_MS = 30_000;
const MAX_RATE_LIMIT_RETRIES = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const args = process.argv.slice(2);
  const allowFallback = args.includes("--allow-fallback");
  if (!allowFallback) process.env.AI_FALLBACK_MODELS = "";

  const llm = resolveLlmConfig();
  if (!llm) {
    console.error("AI isn't configured: set AI_PROVIDER / AI_API_KEY (and AI_MODEL if required) in .env.local.");
    process.exit(2);
  }
  const fallbacks = llm.models.length > 1 ? ` (fallbacks: ${llm.models.slice(1).join(", ")})` : "";
  console.log(`Provider: ${llm.provider} · model: ${llm.models[0]}${fallbacks}\n`);
  let tokens = 0;

  const only = args.filter((a) => !a.startsWith("--"));
  const cases = only.length ? CASES.filter((c) => only.includes(c.id)) : CASES;
  const results: CaseResult[] = [];
  let cost = 0;

  for (const c of cases) {
    process.stdout.write(`▶ ${c.id} … `);
    try {
      let r: InsightsResponse | undefined;
      for (let attempt = 0; !r; attempt++) {
        try {
          r = await generateInsights(c.report);
        } catch (error) {
          if (!(error instanceof AiError && error.status === 429) || attempt >= MAX_RATE_LIMIT_RETRIES) throw error;
          process.stdout.write(`rate-limited, waiting ${RATE_LIMIT_WAIT_MS / 1000}s … `);
          await sleep(RATE_LIMIT_WAIT_MS);
        }
      }
      const checks: CheckResult[] = [...baseChecks(r, buildEvidence(c.report)), ...c.checks(r, c.report)];
      const caseCost = (r.meta.inputTokens * PRICE.input + r.meta.outputTokens * PRICE.output) / 1e6;
      cost += caseCost;
      tokens += r.meta.inputTokens + r.meta.outputTokens;
      const passed = checks.filter((x) => x.pass).length;
      console.log(
        `${passed}/${checks.length} checks · ${(r.meta.latencyMs / 1000).toFixed(1)} s · ${r.meta.inputTokens + r.meta.outputTokens} tokens · ${r.meta.model}`
      );
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
    provider: llm.provider,
    model: llm.models[0],
    tokens,
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
  console.log(`Tokens: ${tokens}  ·  cost: $${summary.costUsd.toFixed(3)}  ·  details: ${file}`);
  process.exit(passed === allChecks.length && errored === 0 ? 0 : 1);
};

main();
