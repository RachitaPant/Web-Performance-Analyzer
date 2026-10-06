/** @jest-environment node */
import { POST as insightsPOST } from "@/app/api/insights/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import type { InsightsOutput } from "@/lib/insights";
import { __resetAnthropicClient } from "@/server/ai/client";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import { groundInsights } from "@/server/ai/grounding";
import { __resetMemoryRateLimit } from "@/server/rateLimit";
import { anthropicMessage, anthropicStream, makeReport, mockFetch } from "./helpers";

const finding = (overrides: Partial<InsightsOutput["findings"][number]> = {}) => ({
  severity: "high" as const,
  title: "Defer render-blocking CSS",
  explanation: "Render-blocking requests delay first paint by an estimated 2.3 s.",
  fix: "Inline critical CSS and load the rest with media=print onload.",
  estimatedImpact: "~2.3 s faster LCP",
  evidence: ["opportunity:render-blocking-insight", "lab:lcp"],
  ...overrides,
});

const output: InsightsOutput = {
  summary: "The page is slow to render on mobile; render-blocking CSS is the biggest win.",
  findings: [
    finding(),
    finding({ severity: "critical", title: "Cut main-thread work", evidence: ["lab:tbt", "diagnostic:main-thread"] }),
    finding({ title: "Hallucinated", evidence: ["opportunity:does-not-exist"] }),
    finding({ title: "Uncited", evidence: [] }),
  ],
};

let siteCounter = 0;
// Each test gets a distinct report so the insights cache never leaks between tests.
const freshReport = () => makeReport({ fetchedAt: `2026-10-06T00:00:${String(++siteCounter).padStart(2, "0")}Z` });

const postJson = (handler: (req: Request) => Promise<Response>, body: unknown) =>
  handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify(body),
    })
  );

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  __resetAnthropicClient();
  __resetMemoryRateLimit();
});
afterEach(() => jest.restoreAllMocks());

describe("evidence", () => {
  const report = makeReport();
  const items = buildEvidence(report);
  const ids = items.map((i) => i.id);

  test("covers every fact the model may cite, with stable ids", () => {
    expect(ids).toEqual(
      expect.arrayContaining([
        "category:performance",
        "lab:lcp",
        "lab:tbt",
        "field:inp",
        "opportunity:render-blocking-insight",
        "diagnostic:dom-size",
        "third-party:1",
        "security:headers",
      ])
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(buildEvidence(report)).toEqual(items);
  });

  test("renders one citable line per item", () => {
    const text = renderEvidence(report, items);
    expect(text).toContain("[lab:tbt] Lab TBT (Total Blocking Time, lab proxy for INP): 963 ms (poor)");
    expect(text).toContain("[field:inp] Real-user p75 INP");
  });

  test("omits sources the report doesn't have", () => {
    const sparse = buildEvidence(makeReport({ field: null, security: null }));
    expect(sparse.some((i) => i.id.startsWith("field:") || i.id === "security:headers")).toBe(false);
  });
});

describe("groundInsights", () => {
  test("drops findings with unknown or missing evidence and orders by severity", () => {
    const ids = new Set(buildEvidence(makeReport()).map((i) => i.id));
    const grounded = groundInsights(output, ids);

    expect(grounded.findings.map((f) => f.title)).toEqual(["Cut main-thread work", "Defer render-blocking CSS"]);
    expect(grounded.dropped.map((d) => d.reason)).toEqual([
      "cites unknown evidence: opportunity:does-not-exist",
      "cites no evidence",
    ]);
  });
});

describe("POST /api/insights", () => {
  test("returns grounded insights and sends a well-formed request", async () => {
    const fetchSpy = mockFetch({ anthropic: () => anthropicMessage(JSON.stringify(output)) });
    const res = await postJson(insightsPOST, { report: freshReport() });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.findings).toHaveLength(2);
    expect(body.meta).toMatchObject({ model: "claude-opus-5-5", droppedFindings: 2, inputTokens: 1200 });

    const [, init] = fetchSpy.mock.calls.find(([u]) => String(u).includes("api.anthropic.com"))!;
    const sent = JSON.parse(String(init!.body));
    const headers = new Headers(init!.headers);
    expect(sent).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default", output_config: { effort: "medium" } });
    expect(sent.output_config.format.type).toBe("json_schema");
    expect(headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    // Report data is fenced as untrusted data in the user turn, never in the system prompt.
    expect(sent.messages[0].content).toMatch(/^<report_evidence>[\s\S]*\[lab:lcp\][\s\S]*<\/report_evidence>/);
    expect(JSON.stringify(sent.system)).not.toContain("963 ms");
  });

  test("serves the same report's insights from cache without calling the model again", async () => {
    const fetchSpy = mockFetch({ anthropic: () => anthropicMessage(JSON.stringify(output)) });
    const report = freshReport();

    await postJson(insightsPOST, { report });
    const second = await postJson(insightsPOST, { report });

    expect(second.headers.get("X-Cache")).toBe("HIT");
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes("api.anthropic.com"))).toHaveLength(1);
  });

  test("a refusal becomes a clear 422, not a crash", async () => {
    mockFetch({ anthropic: () => anthropicMessage("", { content: [], stop_reason: "refusal" }) });
    const res = await postJson(insightsPOST, { report: freshReport() });
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/declined/);
  });

  test("without an API key the feature reports itself as not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await postJson(insightsPOST, { report: freshReport() });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/aren't configured/);
  });

  test("rejects requests without a valid report", async () => {
    expect((await postJson(insightsPOST, { report: { url: "x" } })).status).toBe(400);
  });
});

describe("POST /api/chat", () => {
  const question = [{ role: "user", content: "Why is my LCP slow?" }];

  test("streams the answer as plain text", async () => {
    const fetchSpy = mockFetch({ anthropic: () => anthropicStream(["Render-blocking ", "CSS (opportunity:render-blocking-insight)."]) });
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Render-blocking CSS (opportunity:render-blocking-insight).");

    const [, init] = fetchSpy.mock.calls.find(([u]) => String(u).includes("api.anthropic.com"))!;
    const sent = JSON.parse(String(init!.body));
    expect(sent).toMatchObject({ stream: true, output_config: { effort: "low" }, cache_control: { type: "ephemeral" } });
    expect(sent.system[1].text).toContain("[lab:lcp]");
  });

  test("tells the user when the model declines", async () => {
    mockFetch({ anthropic: () => anthropicStream([], "refusal") });
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });
    expect(await res.text()).toMatch(/declined to answer/);
  });

  test("rejects malformed conversations", async () => {
    const endsWithAssistant = [...question, { role: "assistant", content: "Because…" }];
    expect((await postJson(chatPOST, { report: makeReport(), messages: endsWithAssistant })).status).toBe(400);
    expect((await postJson(chatPOST, { report: makeReport(), messages: [] })).status).toBe(400);
  });

  test("returns 503 up front when AI isn't configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });
    expect(res.status).toBe(503);
  });
});
