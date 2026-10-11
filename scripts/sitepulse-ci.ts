// SitePulse CI: audits a deployment against performance budgets and (optionally) a baseline.
//
//   npx tsx scripts/sitepulse-ci.ts --url https://preview.example.app \
//     [--baseline-url https://example.app] [--budget .sitepulse/budget.json] \
//     [--out-md sitepulse.md] [--out-json sitepulse.json] [--run-url <link>]
//     [--changed-files changed.txt]   # one path per line; PR files, to tell code changes from noise
//
// Env: GOOGLE_PAGESPEED_API_KEY (required); AI_* (optional AI explanation, see .env.example);
// VERCEL_AUTOMATION_BYPASS_SECRET (optional, to audit protected Vercel previews).
// Exit codes: 0 = pass, 1 = budget broken (or regression with failOnRegression), 2 = setup/audit error.
//
// Runs on a CI runner, not a serverless function, so heavy pages get PSI's full time.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { BudgetConfigSchema, compareReports, evaluateBudgets, pickMedianRun, type BudgetConfig } from "@/ci/budget";
import { noRuntimeChanges, renderCiComment, verdict, type CiPageResult } from "@/ci/ciComment";
import { classifyChangedFiles } from "@/ci/changedFiles";
import { requestPageSpeed } from "@/lib/psi";
import type { Report, Strategy } from "@/lib/report";
import { transformPageSpeed } from "@/lib/transformPageSpeed";
import { isAiConfigured } from "@/server/ai/llm";
import { explainRegression } from "@/ci/regression";
import { enrichPageSpeedReport } from "@/server/analyze";
import { redactSecret, stripAuditParams, withBypass, withRunParam } from "@/ci/vercelBypass";

const PSI_DEADLINE_MS = 5 * 60_000;
const args = (() => {
  const out: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") ? "true" : (argv[++i] ?? "true");
  }
  return out;
})();

const fail = (message: string): never => {
  console.error(`sitepulse-ci: ${message}`);
  process.exit(2);
};

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || null;

const redact = (text: string) => redactSecret(text, bypassSecret);

// Runs PSI `runs` times in parallel, keeps the median run, then adds CrUX + Observatory once.
const audit = async (url: string, strategy: Strategy, protectedTarget: boolean, runs: number): Promise<Report> => {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) fail("GOOGLE_PAGESPEED_API_KEY is not set.");
  const base = protectedTarget ? withBypass(url, bypassSecret) : url;
  const start = Date.now();
  const results = await Promise.all(
    Array.from({ length: runs }, async (_, i) => {
      const target = withRunParam(base, `${start.toString(36)}-${i}`);
      const pagespeed = transformPageSpeed(await requestPageSpeed(target, strategy, key!, PSI_DEADLINE_MS), url, strategy);
      pagespeed.finalUrl = stripAuditParams(pagespeed.finalUrl);
      return pagespeed;
    })
  );
  const ms = Date.now() - start;
  const median = pickMedianRun(results);
  const scores = results.map((r) => r.categories.performance).join(", ");
  console.log(`  ${strategy} ${url}: performance ${median.categories.performance} (median of [${scores}], ${(ms / 1000).toFixed(0)} s)`);
  return enrichPageSpeedReport(median, ms);
};

const loadBudget = (path: string): BudgetConfig => {
  if (!existsSync(path)) {
    console.log(`No ${path}; using defaults (audit "/" on mobile, no hard budgets).`);
    return BudgetConfigSchema.parse({});
  }
  const parsed = BudgetConfigSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) fail(`invalid ${path}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return parsed.data!;
};

const main = async () => {
  const headUrl = args.url ?? fail("--url is required");
  const baseUrl = args["baseline-url"] || null;
  const config = loadBudget(args.budget ?? ".sitepulse/budget.json");
  // Only the deployment under test can be a protected preview; the baseline is public production.
  const headProtected = Boolean(bypassSecret);

  const changesPath = args["changed-files"];
  const changes = changesPath
    ? existsSync(changesPath)
      ? classifyChangedFiles(readFileSync(changesPath, "utf8").split(/\r?\n/))
      : fail(`--changed-files ${changesPath} not found`)
    : null;
  if (changes) {
    console.log(`Changed files: ${changes.total} (${changes.runtime.length} affect the app${changes.runtime.length ? `: ${changes.runtime.slice(0, 5).join(", ")}${changes.runtime.length > 5 ? ", …" : ""}` : ""})`);
  }

  const pages: CiPageResult[] = [];
  for (const page of config.pages) {
    console.log(`Auditing ${page.path} (${page.strategy})…`);
    const [head, base] = await Promise.all([
      audit(new URL(page.path, headUrl).toString(), page.strategy, headProtected, config.runs),
      baseUrl ? audit(new URL(page.path, baseUrl).toString(), page.strategy, false, config.runs) : Promise.resolve(null),
    ]);

    const budgetChecks = evaluateBudgets(head, config.budgets);
    const comparison = base ? compareReports(base, head, config.regression) : null;
    const noteworthy =
      budgetChecks.some((c) => !c.pass) || comparison?.regressed || (comparison?.opportunityChanges.length ?? 0) > 0;

    let ai: CiPageResult["ai"] = null;
    // With no app code changed there is nothing to explain: differences are measurement noise.
    if (noteworthy && !noRuntimeChanges({ changes }) && isAiConfigured()) {
      try {
        ai = await explainRegression(head, comparison, budgetChecks, changes?.runtime ?? null);
      } catch (error) {
        console.warn(`  AI explanation skipped: ${error instanceof Error ? error.message : error}`);
      }
    }
    pages.push({ path: page.path, strategy: page.strategy, head, base, budgetChecks, comparison, ai });
  }

  const summary = {
    pages,
    failOnRegression: config.regression.failOnRegression,
    headLabel: args["head-label"] ?? "this deployment",
    baseLabel: args["base-label"] ?? "baseline",
    runUrl: args["run-url"],
    changes,
  };
  const markdown = redact(renderCiComment(summary));
  const result = verdict(summary);

  if (args["out-md"]) writeFileSync(args["out-md"], markdown);
  if (args["out-json"]) {
    // Screenshots are large and not useful in an artifact.
    const slim = { ...summary, pages: pages.map((p) => ({ ...p, head: { ...p.head, screenshot: null }, base: p.base && { ...p.base, screenshot: null } })) };
    writeFileSync(args["out-json"], redact(JSON.stringify({ verdict: result, ...slim }, null, 2)));
  }
  console.log(`\n${markdown}\n`);
  console.log(
    result.failed
      ? "Result: FAILED"
      : result.informational
        ? "Result: informational (no app code changed; budgets not enforced)"
        : result.regressed
          ? "Result: passed with warnings"
          : "Result: passed"
  );
  process.exit(result.failed ? 1 : 0);
};

main().catch((error) => {
  console.error(redact(`sitepulse-ci: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(2);
});
