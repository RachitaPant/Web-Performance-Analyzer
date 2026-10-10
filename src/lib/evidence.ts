import type { Report } from "@/lib/report";
import { formatBytes, formatMs, ratingFromScore } from "@/lib/format";

export interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  rating?: string;
  // Raw number behind `value`, used by the eval to check numbers quoted in model output.
  raw?: number;
}

const ms = (v: number | null) => (v == null ? null : formatMs(v));

// Turns a Report into a flat, id-tagged list of facts. The model may only cite these ids,
// which makes every finding mechanically checkable. Order is deterministic.
export const buildEvidence = (report: Report): EvidenceItem[] => {
  const items: EvidenceItem[] = [];
  const push = (item: EvidenceItem | null) => item && items.push(item);

  const c = report.categories;
  (
    [
      ["performance", "Lighthouse performance score", c.performance],
      ["accessibility", "Accessibility score", c.accessibility],
      ["best-practices", "Best practices score", c.bestPractices],
      ["seo", "SEO score", c.seo],
    ] as const
  ).forEach(([key, label, score]) =>
    push(score == null ? null : { id: `category:${key}`, label, value: `${score}/100`, raw: score })
  );

  const lab = report.lab;
  (
    [
      ["lcp", "Lab LCP (Largest Contentful Paint)", lab.lcp],
      ["tbt", "Lab TBT (Total Blocking Time, lab proxy for INP)", lab.tbt],
      ["cls", "Lab CLS (Cumulative Layout Shift)", lab.cls],
      ["fcp", "Lab FCP (First Contentful Paint)", lab.fcp],
      ["speed-index", "Lab Speed Index", lab.speedIndex],
      ["ttfb", "Lab server response time (TTFB)", lab.ttfb],
    ] as const
  ).forEach(([key, label, m]) => {
    if (m.value == null) return;
    push({
      id: `lab:${key}`,
      label,
      value: key === "cls" ? m.value.toFixed(3) : formatMs(m.value),
      rating: ratingFromScore(m.score) ?? undefined,
      raw: m.value,
    });
  });

  const field = report.field;
  if (field) {
    (
      [
        ["lcp", "Real-user p75 LCP", field.lcp],
        ["inp", "Real-user p75 INP (Interaction to Next Paint)", field.inp],
        ["cls", "Real-user p75 CLS", field.cls],
        ["fcp", "Real-user p75 FCP", field.fcp],
        ["ttfb", "Real-user p75 TTFB", field.ttfb],
      ] as const
    ).forEach(([key, label, m]) => {
      if (!m) return;
      push({
        id: `field:${key}`,
        label: `${label} (${field.scope === "url" ? "this URL" : "whole origin"}, last 28 days)`,
        value: key === "cls" ? m.p75.toFixed(2) : formatMs(m.p75),
        rating: m.rating,
        raw: m.p75,
      });
    });
  }

  report.opportunities.forEach((o) => {
    const savings = [
      o.savingsMs > 0 ? `est. ${formatMs(o.savingsMs)} savings` : null,
      o.savingsBytes > 0 ? `${formatBytes(o.savingsBytes)} smaller` : null,
    ].filter(Boolean);
    push({
      id: `opportunity:${o.id}`,
      label: `Failing Lighthouse audit: ${o.title}`,
      // Lighthouse's own displayValue mostly restates the savings; use it only when we have none.
      value: savings.join("; ") || o.displayValue || "failing, no savings estimate",
      raw: o.savingsMs || undefined,
    });
  });

  const d = report.diagnostics;
  push(d.totalBytes == null ? null : { id: "diagnostic:page-weight", label: "Total page weight", value: formatBytes(d.totalBytes), raw: d.totalBytes });
  push(d.requestCount == null ? null : { id: "diagnostic:requests", label: "Network requests", value: `${d.requestCount}`, raw: d.requestCount });
  push(
    d.thirdPartyRequests == null
      ? null
      : {
          id: "diagnostic:third-party",
          label: "Third-party requests",
          value: `${d.thirdPartyRequests} requests, ${formatBytes(d.thirdPartyBytes)}`,
          raw: d.thirdPartyRequests,
        }
  );
  push(d.domSize == null ? null : { id: "diagnostic:dom-size", label: "DOM elements", value: `${d.domSize}`, raw: d.domSize });
  push(d.mainThreadMs == null ? null : { id: "diagnostic:main-thread", label: "Main-thread work", value: ms(d.mainThreadMs)!, raw: d.mainThreadMs });
  push(d.jsBootupMs == null ? null : { id: "diagnostic:js-execution", label: "JavaScript execution time", value: ms(d.jsBootupMs)!, raw: d.jsBootupMs });
  d.thirdParties.slice(0, 3).forEach((t, i) =>
    push({
      id: `third-party:${i + 1}`,
      label: `Third party #${i + 1} by main-thread time: ${t.entity}`,
      value: `${formatMs(t.mainThreadMs)} main thread, ${formatBytes(t.bytes)}`,
      raw: t.mainThreadMs,
    })
  );

  if (report.security) {
    push({
      id: "security:headers",
      label: "Mozilla HTTP Observatory security-header grade",
      value: `${report.security.grade} (score ${report.security.score}, ${report.security.testsFailed} checks failed)`,
    });
  }

  return items;
};

// Rendered for the prompt as a compact table the model can cite by id.
export const renderEvidence = (report: Report, items: EvidenceItem[]): string =>
  [
    `URL: ${report.finalUrl}`,
    `Device: ${report.strategy}`,
    `Audited: ${report.fetchedAt} (Lighthouse ${report.lighthouseVersion})`,
    "",
    ...items.map((i) => `[${i.id}] ${i.label}: ${i.value}${i.rating ? ` (${i.rating})` : ""}`),
  ].join("\n");
