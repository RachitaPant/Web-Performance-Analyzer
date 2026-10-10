/** @jest-environment node */
import * as analyze from "@/app/api/analyze/route";
import * as chat from "@/app/api/chat/route";
import * as insights from "@/app/api/insights/route";

// Vercel Hobby rejects the whole deployment if any function asks for more than 60 s.
const VERCEL_HOBBY_MAX_DURATION = 60;

test.each([
  ["api/analyze", analyze.maxDuration],
  ["api/chat", chat.maxDuration],
  ["api/insights", insights.maxDuration],
])("%s maxDuration fits the Vercel Hobby limit", (_route, maxDuration) => {
  expect(maxDuration).toBeGreaterThanOrEqual(1);
  expect(maxDuration).toBeLessThanOrEqual(VERCEL_HOBBY_MAX_DURATION);
});
