/** @jest-environment node */
import { POST as insightsPOST } from "@/app/api/insights/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import { buildEvidence, renderEvidence } from "@/lib/evidence";
import type { InsightsOutput } from "@/lib/insights";
import { resolveLlmConfig } from "@/server/ai/config";
import { groundInsights } from "@/server/ai/grounding";
import { __resetLlm } from "@/server/ai/llm";
import { __resetMemoryRateLimit } from "@/server/rateLimit";
import { chatCompletion, chatStream, json, makeReport, mockFetch } from "./helpers";

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

let counter = 0;
// Each test gets a distinct report so the insights cache never leaks between tests.
const freshReport = () => makeReport({ fetchedAt: `2026-10-06T00:00:${String(++counter).padStart(2, "0")}Z` });

const postJson = (handler: (req: Request) => Promise<Response>, body: unknown) =>
  handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify(body),
    })
  );

const llmCalls = (spy: jest.SpyInstance) => spy.mock.calls.filter(([u]) => String(u).includes("/chat/completions"));
const sentBody = (spy: jest.SpyInstance, i = 0) => JSON.parse(String(llmCalls(spy)[i][1]!.body));

const AI_ENV = ["AI_PROVIDER", "AI_API_KEY", "AI_MODEL", "AI_BASE_URL", "AI_FALLBACK_MODELS", "AI_JSON_MODE"];

beforeEach(() => {
  AI_ENV.forEach((k) => delete process.env[k]);
  process.env.AI_PROVIDER = "groq";
  process.env.AI_API_KEY = "test-key";
  __resetLlm();
  __resetMemoryRateLimit();
});
afterEach(() => jest.restoreAllMocks());

describe("provider config", () => {
  test("groq preset needs only a key and uses verified defaults", () => {
    expect(resolveLlmConfig({ AI_API_KEY: "k" })).toMatchObject({
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
      jsonMode: "json_schema",
    });
  });

  test("presets without a verified default require AI_MODEL", () => {
    expect(resolveLlmConfig({ AI_PROVIDER: "openrouter", AI_API_KEY: "k" })).toBeNull();
    expect(resolveLlmConfig({ AI_PROVIDER: "openrouter", AI_API_KEY: "k", AI_MODEL: "some/model" })?.models).toEqual(["some/model"]);
  });

  test("ollama runs keyless; custom needs a base URL; unknown providers are rejected", () => {
    expect(resolveLlmConfig({ AI_PROVIDER: "ollama", AI_MODEL: "llama3.2" })).toMatchObject({ apiKey: null, jsonMode: "json_object" });
    expect(resolveLlmConfig({ AI_PROVIDER: "custom", AI_MODEL: "m" })).toBeNull();
    expect(resolveLlmConfig({ AI_PROVIDER: "custom", AI_MODEL: "m", AI_BASE_URL: "https://llm.example.com/v1/" })?.baseUrl).toBe(
      "https://llm.example.com/v1"
    );
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(resolveLlmConfig({ AI_PROVIDER: "nope", AI_API_KEY: "k" })).toBeNull();
  });

  test("no key means not configured", () => {
    expect(resolveLlmConfig({})).toBeNull();
  });
});

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
  test("returns grounded insights and sends a well-formed OpenAI-compatible request", async () => {
    const fetchSpy = mockFetch({ llm: () => chatCompletion(JSON.stringify(output)) });
    const res = await postJson(insightsPOST, { report: freshReport() });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.findings).toHaveLength(2);
    expect(body.meta).toMatchObject({ model: "openai/gpt-oss-120b", droppedFindings: 2, inputTokens: 1200 });

    const [url, init] = llmCalls(fetchSpy)[0];
    const sent = sentBody(fetchSpy);
    expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(new Headers(init!.headers).get("authorization")).toBe("Bearer test-key");
    expect(sent).toMatchObject({ model: "openai/gpt-oss-120b", reasoning_effort: "medium" });
    expect(sent.response_format).toMatchObject({ type: "json_schema", json_schema: { name: "audit_insights", strict: true } });
    // Strict mode: every object closed and fully required.
    const findingSchema = sent.response_format.json_schema.schema.properties.findings.items;
    expect(findingSchema.additionalProperties).toBe(false);
    expect(findingSchema.required).toEqual(expect.arrayContaining(["severity", "evidence", "fix"]));
    // Report data is fenced as untrusted data in the user turn, never in the system prompt.
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).not.toContain("963 ms");
    expect(sent.messages[1].content).toMatch(/^<report_evidence>[\s\S]*\[lab:lcp\][\s\S]*<\/report_evidence>/);
  });

  test("repairs output that fails schema validation with one follow-up call", async () => {
    const replies = ['{"summary": "missing findings"}', JSON.stringify(output)];
    const fetchSpy = mockFetch({ llm: () => chatCompletion(replies.shift()!) });
    const res = await postJson(insightsPOST, { report: freshReport() });

    expect(res.status).toBe(200);
    expect(llmCalls(fetchSpy)).toHaveLength(2);
    const repair = sentBody(fetchSpy, 1).messages;
    expect(repair.at(-2)).toMatchObject({ role: "assistant", content: '{"summary": "missing findings"}' });
    expect(repair.at(-1).content).toMatch(/didn't match the required schema \(findings/);
  });

  test("gives up cleanly when the repair is also invalid", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ llm: () => chatCompletion("not json at all") });
    const res = await postJson(insightsPOST, { report: freshReport() });
    expect(res.status).toBe(502);
  });

  test("falls back to the next model when the primary is rate-limited", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = mockFetch({
      llm: (_u, init) =>
        JSON.parse(String(init!.body)).model === "openai/gpt-oss-120b"
          ? new Response("rate limited", { status: 429, headers: { "retry-after": "60" } })
          : chatCompletion(JSON.stringify(output), { model: "openai/gpt-oss-20b" }),
    });
    const res = await postJson(insightsPOST, { report: freshReport() });

    expect(res.status).toBe(200);
    expect((await res.json()).meta.model).toBe("openai/gpt-oss-20b");
    expect(llmCalls(fetchSpy).map((_, i) => sentBody(fetchSpy, i).model)).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  });

  test("auth errors don't burn through fallbacks and surface as misconfiguration", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = mockFetch({ llm: () => json({ error: { message: "invalid key" } }, 401) });
    const res = await postJson(insightsPOST, { report: freshReport() });
    expect(res.status).toBe(503);
    expect(llmCalls(fetchSpy)).toHaveLength(1);
  });

  test("works with a json_object provider (keyless Ollama): schema goes in the prompt", async () => {
    Object.assign(process.env, { AI_PROVIDER: "ollama", AI_MODEL: "llama3.2" });
    delete process.env.AI_API_KEY;
    const fetchSpy = mockFetch({ llm: () => chatCompletion("```json\n" + JSON.stringify(output) + "\n```") });
    const res = await postJson(insightsPOST, { report: freshReport() });

    expect(res.status).toBe(200);
    const [url, init] = llmCalls(fetchSpy)[0];
    const sent = sentBody(fetchSpy);
    expect(String(url)).toBe("http://localhost:11434/v1/chat/completions");
    expect(new Headers(init!.headers).has("authorization")).toBe(false);
    expect(sent.response_format).toEqual({ type: "json_object" });
    expect(sent).not.toHaveProperty("reasoning_effort");
    expect(sent.messages[0].content).toContain("matches this JSON Schema");
  });

  test("serves the same report's insights from cache without calling the model again", async () => {
    const fetchSpy = mockFetch({ llm: () => chatCompletion(JSON.stringify(output)) });
    const report = freshReport();

    await postJson(insightsPOST, { report });
    const second = await postJson(insightsPOST, { report });

    expect(second.headers.get("X-Cache")).toBe("HIT");
    expect(llmCalls(fetchSpy)).toHaveLength(1);
  });

  test("a content-filter stop becomes a clear 422", async () => {
    mockFetch({ llm: () => chatCompletion("", { finish_reason: "content_filter" }) });
    const res = await postJson(insightsPOST, { report: freshReport() });
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/declined/);
  });

  test("without a provider key the feature reports itself as not configured", async () => {
    delete process.env.AI_API_KEY;
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
    const fetchSpy = mockFetch({ llm: () => chatStream(["Render-blocking ", "CSS (opportunity:render-blocking-insight)."]) });
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Render-blocking CSS (opportunity:render-blocking-insight).");

    const sent = sentBody(fetchSpy);
    expect(sent).toMatchObject({ stream: true, reasoning_effort: "low" });
    expect(sent.messages[0]).toMatchObject({ role: "system" });
    expect(sent.messages[0].content).toContain("[lab:lcp]");
    expect(sent.messages.slice(1)).toEqual(question);
  });

  test("tells the user when the answer was cut off or filtered", async () => {
    mockFetch({ llm: () => chatStream(["Partial"], "length") });
    expect(await (await postJson(chatPOST, { report: makeReport(), messages: question })).text()).toMatch(/truncated/);

    jest.restoreAllMocks();
    mockFetch({ llm: () => chatStream([], "content_filter") });
    expect(await (await postJson(chatPOST, { report: makeReport(), messages: question })).text()).toMatch(/declined/);
  });

  test("rate limits from the provider surface as an HTTP error before streaming", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ llm: () => new Response("busy", { status: 429 }) });
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });
    expect(res.status).toBe(429);
  });

  test("rejects malformed conversations", async () => {
    const endsWithAssistant = [...question, { role: "assistant", content: "Because…" }];
    expect((await postJson(chatPOST, { report: makeReport(), messages: endsWithAssistant })).status).toBe(400);
    expect((await postJson(chatPOST, { report: makeReport(), messages: [] })).status).toBe(400);
  });

  test("returns 503 up front when AI isn't configured", async () => {
    delete process.env.AI_API_KEY;
    const res = await postJson(chatPOST, { report: makeReport(), messages: question });
    expect(res.status).toBe(503);
  });
});
