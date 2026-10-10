import type { BudgetCheck, Comparison, MetricDelta } from "./budget";
import { formatBytes, formatMs } from "./format";
import type { Report, Strategy } from "./report";

// Marker that lets the workflow find and update its own comment instead of adding a new one.
export const CI_COMMENT_MARKER = "<!-- sitepulse-ci -->";

export interface CiPageResult {
  path: string;
  strategy: Strategy;
  head: Report;
  base: Report | null;
  budgetChecks: BudgetCheck[];
  comparison: Comparison | null;
  ai: { summary: string; causes: { text: string; evidence: string[] }[] } | null;
}

export interface CiSummary {
  pages: CiPageResult[];
  failOnRegression: boolean;
  headLabel: string; // e.g. "this PR (preview)"
  baseLabel: string; // e.g. "production"
  runUrl?: string;
}

export const formatMetric = (unit: BudgetCheck["unit"], v: number | null) => {
  if (v === null) return "n/a";
  if (unit === "score") return String(Math.round(v));
  if (unit === "cls") return v.toFixed(3);
  if (unit === "bytes") return formatBytes(v);
  return formatMs(v);
};

const delta = (d: MetricDelta) => {
  if (d.base === null || d.head === null) return "";
  const diff = d.head - d.base;
  if (d.unit === "score") return diff === 0 ? "±0" : `${diff > 0 ? "+" : ""}${Math.round(diff)} pts`;
  if (d.unit === "cls") return `${diff >= 0 ? "+" : ""}${diff.toFixed(3)}`;
  // From a zero baseline a percentage is meaningless; show the absolute change.
  if (d.base === 0) return diff === 0 ? "±0" : `+${formatMetric(d.unit, diff)}`;
  const ratio = d.head / d.base;
  if (ratio >= 10) return `×${Math.round(ratio).toLocaleString("en-US")}`;
  const pct = Math.round((diff / d.base) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
};

export const verdict = (summary: CiSummary) => {
  const budgetFailed = summary.pages.some((p) => p.budgetChecks.some((c) => !c.pass));
  const regressed = summary.pages.some((p) => p.comparison?.regressed);
  const failed = budgetFailed || (summary.failOnRegression && regressed);
  return { budgetFailed, regressed, failed };
};

export const renderCiComment = (summary: CiSummary): string => {
  const { budgetFailed, regressed, failed } = verdict(summary);
  const headline = failed
    ? budgetFailed
      ? "❌ **Performance budget exceeded**"
      : "❌ **Performance regressed**"
    : regressed
      ? "⚠️ **Possible regression** (within lab-noise tolerance; not failing)"
      : "✅ **All performance budgets met**";

  const lines: string[] = [CI_COMMENT_MARKER, "## ⚡ SitePulse performance check", "", headline, ""];

  for (const page of summary.pages) {
    lines.push(`### \`${page.path}\` · ${page.strategy}`, "");

    const budgets = new Map(page.budgetChecks.map((c) => [c.key, c]));
    const rows = page.comparison
      ? page.comparison.deltas
      : page.budgetChecks.map((c) => ({ key: c.key, label: c.label, unit: c.unit, base: null, head: c.actual, regressed: false }));

    const header = page.base
      ? `| Metric | Budget | ${summary.baseLabel} | ${summary.headLabel} | Change |`
      : `| Metric | Budget | ${summary.headLabel} |`;
    lines.push(header, page.base ? "| --- | --- | --- | --- | --- |" : "| --- | --- | --- |");

    for (const row of rows) {
      const budget = budgets.get(row.key);
      const budgetCell = budget
        ? `${budget.unit === "score" ? "≥" : "≤"} ${formatMetric(row.unit, budget.limit)} ${budget.pass ? "✅" : "❌"}`
        : "–";
      const headCell = `${formatMetric(row.unit, row.head)}${row.regressed ? " ⚠️" : ""}`;
      lines.push(
        page.base
          ? `| ${row.label} | ${budgetCell} | ${formatMetric(row.unit, row.base)} | ${headCell} | ${delta(row as MetricDelta)} |`
          : `| ${row.label} | ${budgetCell} | ${headCell} |`
      );
    }
    lines.push("");

    const changes = page.comparison?.opportunityChanges ?? [];
    if (changes.length > 0) {
      lines.push("**New or worse opportunities**", "");
      for (const c of changes.slice(0, 6)) {
        lines.push(
          c.status === "new"
            ? `- 🆕 ${c.title}${c.savingsMs > 0 ? ` (est. ${formatMs(c.savingsMs)})` : ""}`
            : `- 📈 ${c.title}: est. savings ${formatMs(c.baseSavingsMs)} → ${formatMs(c.savingsMs)}`
        );
      }
      lines.push("");
    }

    if (page.ai) {
      lines.push("<details><summary>🤖 AI analysis (cites the measured evidence)</summary>", "", page.ai.summary, "");
      for (const cause of page.ai.causes) lines.push(`- ${cause.text} — _${cause.evidence.join(", ")}_`);
      lines.push("", "</details>", "");
    }
  }

  lines.push(
    "<sub>Lab data from Google PageSpeed Insights (Lighthouse). Lab scores vary run to run, so regressions",
    "only fail the check when `failOnRegression` is set in `.sitepulse/budget.json`." +
      (summary.runUrl ? ` [Workflow run](${summary.runUrl})` : "") +
      "</sub>"
  );
  return lines.join("\n");
};
