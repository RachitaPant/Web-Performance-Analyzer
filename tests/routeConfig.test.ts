/** @jest-environment node */
import * as analyze from "@/app/api/analyze/route";
import * as enrich from "@/app/api/analyze/enrich/route";
import * as chat from "@/app/api/chat/route";
import * as insights from "@/app/api/insights/route";

// Vercel Hobby with Fluid Compute caps functions at 300 s (60 s without Fluid Compute) and
// rejects the whole deployment if any route asks for more.
const VERCEL_HOBBY_MAX_DURATION = 300;

test.each([
  ["api/analyze", analyze.maxDuration],
  ["api/analyze/enrich", enrich.maxDuration],
  ["api/chat", chat.maxDuration],
  ["api/insights", insights.maxDuration],
])("%s maxDuration fits the Vercel Hobby limit", (_route, maxDuration) => {
  expect(maxDuration).toBeGreaterThanOrEqual(1);
  expect(maxDuration).toBeLessThanOrEqual(VERCEL_HOBBY_MAX_DURATION);
});

test("PageSpeed's deadline leaves headroom inside the analyze route's maxDuration", async () => {
  const src = (await import("node:fs")).readFileSync("src/server/pagespeed.ts", "utf8");
  const deadlineMs = Number(/PSI_DEADLINE_MS = ([\d_]+)/.exec(src)![1].replace(/_/g, ""));
  expect(deadlineMs / 1000).toBeLessThanOrEqual(analyze.maxDuration - 20);
});
