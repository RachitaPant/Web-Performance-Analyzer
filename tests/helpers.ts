import psiFixture from "./fixtures/psi-webdev-mobile.json";
import cruxFixture from "./fixtures/crux-history-record.json";
import observatoryFixture from "./fixtures/observatory-webdev.json";
import type { Report } from "@/lib/report";
import { transformCruxHistory } from "@/server/cruxHistory";
import { transformPageSpeed, type PsiResponse } from "@/lib/transformPageSpeed";

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
export const mockFetch = (handlers: {
  psi?: Handler;
  crux?: Handler;
  observatory?: Handler;
  llm?: Handler;
}) => {
  const defaults: Required<typeof handlers> = {
    psi: () => json(psiFixture),
    crux: () => json(cruxFixture),
    observatory: () => json(observatoryFixture),
    llm: () => {
      throw new Error("Unexpected LLM API call — pass an `llm` handler");
    },
  };
  const h = { ...defaults, ...handlers };

  return jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("pagespeedonline")) return h.psi(url, init);
    if (url.includes("chromeuxreport")) return h.crux(url, init);
    if (url.includes("observatory")) return h.observatory(url, init);
    if (url.includes("/chat/completions")) return h.llm(url, init);
    throw new Error(`Unexpected fetch: ${url}`);
  });
};

export { json };

// An OpenAI-compatible chat completion whose message content is `content`.
export const chatCompletion = (content: string, overrides: { finish_reason?: string; model?: string } = {}) =>
  json({
    id: "chatcmpl-test",
    object: "chat.completion",
    model: overrides.model ?? "openai/gpt-oss-120b",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: overrides.finish_reason ?? "stop" }],
    usage: { prompt_tokens: 1200, completion_tokens: 400, total_tokens: 1600 },
  });

// An OpenAI-compatible streamed completion (server-sent events) emitting `chunks` as deltas.
export const chatStream = (chunks: string[], finishReason = "stop") => {
  const events = [
    ...chunks.map((content) => ({ choices: [{ index: 0, delta: { content }, finish_reason: null }] })),
    { choices: [{ index: 0, delta: {}, finish_reason: finishReason }] },
  ];
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
};
