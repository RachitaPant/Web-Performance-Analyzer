import psiFixture from "./fixtures/psi-webdev-mobile.json";
import cruxFixture from "./fixtures/crux-history-record.json";
import observatoryFixture from "./fixtures/observatory-webdev.json";
import type { Report } from "@/lib/report";
import { transformCruxHistory } from "@/server/cruxHistory";
import { transformPageSpeed, type PsiResponse } from "@/server/transformPageSpeed";

export const psi = psiFixture as unknown as PsiResponse;
export const cruxRecord = cruxFixture.record;

// A complete Report as analyze() would build it when every source succeeds.
export const makeReport = (overrides: Partial<Report> = {}): Report => ({
  ...transformPageSpeed(psi, "https://web.dev/", "mobile"),
  fieldHistory: { scope: "url", weeks: transformCruxHistory(cruxRecord) },
  security: {
    grade: "A+",
    score: 100,
    testsPassed: 11,
    testsFailed: 1,
    detailsUrl: "https://developer.mozilla.org/en-US/observatory/analyze?host=web.dev",
  },
  sources: {
    pagespeed: { status: "ok", message: null, ms: 28000 },
    cruxHistory: { status: "ok", message: null, ms: 900 },
    observatory: { status: "ok", message: null, ms: 1700 },
  },
  ...overrides,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

// Routes mocked fetch calls by API host so each test can fail one source at a time.
export const mockFetch = (handlers: { psi?: Handler; crux?: Handler; observatory?: Handler }) => {
  const defaults: Required<typeof handlers> = {
    psi: () => json(psiFixture),
    crux: () => json(cruxFixture),
    observatory: () => json(observatoryFixture),
  };
  const h = { ...defaults, ...handlers };

  return jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("pagespeedonline")) return h.psi(url, init);
    if (url.includes("chromeuxreport")) return h.crux(url, init);
    if (url.includes("observatory")) return h.observatory(url, init);
    throw new Error(`Unexpected fetch: ${url}`);
  });
};

export { json };
