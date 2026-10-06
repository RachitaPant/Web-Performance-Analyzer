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
export const mockFetch = (handlers: {
  psi?: Handler;
  crux?: Handler;
  observatory?: Handler;
  anthropic?: Handler;
}) => {
  const defaults: Required<typeof handlers> = {
    psi: () => json(psiFixture),
    crux: () => json(cruxFixture),
    observatory: () => json(observatoryFixture),
    anthropic: () => {
      throw new Error("Unexpected Anthropic API call — pass an `anthropic` handler");
    },
  };
  const h = { ...defaults, ...handlers };

  return jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("pagespeedonline")) return h.psi(url, init);
    if (url.includes("chromeuxreport")) return h.crux(url, init);
    if (url.includes("observatory")) return h.observatory(url, init);
    if (url.includes("api.anthropic.com")) return h.anthropic(url, init);
    throw new Error(`Unexpected fetch: ${url}`);
  });
};

export { json };

// A Messages API response whose single text block is `text` (structured output arrives as JSON text).
export const anthropicMessage = (text: string, overrides: Record<string, unknown> = {}) =>
  json({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1200, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    ...overrides,
  });

// A streamed Messages API response (server-sent events) emitting `chunks` as text deltas.
export const anthropicStream = (chunks: string[], stopReason = "end_turn") => {
  const events: [string, unknown][] = [
    ["message_start", { type: "message_start", message: { id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 900, output_tokens: 1 } } }],
    ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
    ...chunks.map((text): [string, unknown] => ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }]),
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    ["message_delta", { type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 42 } }],
    ["message_stop", { type: "message_stop" }],
  ];
  const body = events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
};
