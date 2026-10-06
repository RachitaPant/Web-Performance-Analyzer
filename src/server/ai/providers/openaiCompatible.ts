import { z } from "zod";
import type { LlmConfig } from "../config";
import { AiError, type JsonRequest, type JsonResult, type LlmClient, type LlmUsage, type ReasoningEffort, type TextStreamRequest } from "../llm";

// Adapter for any OpenAI-compatible Chat Completions API (Groq, OpenRouter, Gemini's compat
// endpoint, OpenAI, Ollama, ...). Plain fetch — no vendor SDK.

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 8_000; // includes reasoning tokens on reasoning models
const MAX_RETRY_AFTER_WAIT_MS = 5_000;

type Message = { role: "system" | "user" | "assistant"; content: string };

interface Completion {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string | null }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toUsage = (u: Completion["usage"]): LlmUsage => ({
  inputTokens: u?.prompt_tokens ?? 0,
  outputTokens: u?.completion_tokens ?? 0,
  cachedInputTokens: u?.prompt_tokens_details?.cached_tokens ?? 0,
});

// Strict json_schema requires every object to be closed and fully required.
const toStrictJsonSchema = (schema: z.ZodType): Record<string, unknown> => {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "object" && n.properties && typeof n.properties === "object") {
      n.additionalProperties = false;
      n.required = Object.keys(n.properties);
    }
    Object.values(n).forEach((v) => (Array.isArray(v) ? v.forEach(visit) : visit(v)));
  };
  visit(json);
  return json;
};

// Some models wrap JSON in Markdown fences even in JSON mode.
const parseJsonContent = (content: string): unknown => {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
};

const describeIssues = (error: z.ZodError) =>
  error.issues
    .slice(0, 8)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");

// Should we try the next fallback model after this status?
const isRetryable = (status: number) => status === 429 || status >= 500;

const errorFor = (status: number, detail: string): AiError => {
  console.error(`LLM API ${status}: ${detail.slice(0, 500)}`);
  if (status === 401 || status === 403) return new AiError(503, "AI features are misconfigured on this deployment.");
  if (status === 429) return new AiError(429, "The AI service is busy right now. Please try again in a minute.");
  if (status === 400 || status === 404 || status === 422) return new AiError(500, "The AI request was rejected. Please try again.");
  return new AiError(502, "The AI service had a problem. Please try again shortly.");
};

export const createOpenAiCompatibleClient = (config: LlmConfig): LlmClient => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const reasoning = (effort?: ReasoningEffort) =>
    config.supportsReasoningEffort && effort ? { reasoning_effort: effort } : {};

  // POSTs to /chat/completions, walking the model list on rate limits and server errors.
  // Returns the first OK response and the model that produced it.
  const post = async (body: (model: string) => Record<string, unknown>): Promise<{ res: Response; model: string }> => {
    let lastError: AiError | null = null;

    for (const model of config.models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        let res: Response;
        try {
          res = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify(body(model)),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
        } catch (error) {
          const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
          lastError = new AiError(timedOut ? 504 : 502, timedOut ? "The AI took too long to respond. Please try again." : "Couldn't reach the AI service.");
          break; // next model
        }

        if (res.ok) return { res, model };

        const detail = await res.text().catch(() => "");
        lastError = errorFor(res.status, detail);
        if (!isRetryable(res.status)) throw lastError;

        // A short Retry-After is worth waiting for once; otherwise move to the next model.
        const retryAfterMs = Number(res.headers.get("retry-after")) * 1000;
        if (attempt === 0 && res.status === 429 && retryAfterMs > 0 && retryAfterMs <= MAX_RETRY_AFTER_WAIT_MS) {
          await sleep(retryAfterMs);
          continue;
        }
        break;
      }
    }
    throw lastError ?? new AiError(502, "The AI service had a problem. Please try again shortly.");
  };

  const responseFormat = (request: JsonRequest<unknown>) =>
    config.jsonMode === "json_schema"
      ? {
          type: "json_schema",
          json_schema: { name: request.schemaName, strict: true, schema: toStrictJsonSchema(request.schema) },
        }
      : { type: "json_object" };

  const complete = async (messages: Message[], request: JsonRequest<unknown>) => {
    const { res, model } = await post((m) => ({
      model: m,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
      response_format: responseFormat(request),
      ...reasoning(request.effort),
    }));
    const completion = (await res.json()) as Completion;
    const choice = completion.choices?.[0];
    if (choice?.finish_reason === "content_filter") throw new AiError(422, "The AI declined to analyze this report.");
    if (choice?.finish_reason === "length") throw new AiError(502, "The AI returned an incomplete analysis. Please try again.");
    return { content: choice?.message?.content ?? "", model: completion.model ?? model, usage: toUsage(completion.usage) };
  };

  return {
    provider: config.provider,
    model: config.models[0],

    async generateJson<T>(request: JsonRequest<T>): Promise<JsonResult<T>> {
      // In json_object mode the API only guarantees valid JSON, so the schema goes in the prompt.
      const system =
        config.jsonMode === "json_object"
          ? `${request.system}\n\nRespond with a single JSON object that matches this JSON Schema exactly:\n${JSON.stringify(toStrictJsonSchema(request.schema))}`
          : request.system;
      const messages: Message[] = [
        { role: "system", content: system },
        { role: "user", content: request.user },
      ];

      const first = await complete(messages, request as JsonRequest<unknown>);
      const usage = { ...first.usage };
      let { content, model } = first;

      // Validate; on failure, give the model one chance to repair its own output.
      for (let attempt = 0; ; attempt++) {
        let problem: string;
        try {
          const parsed = request.schema.safeParse(parseJsonContent(content));
          if (parsed.success) return { data: parsed.data, model, usage };
          problem = describeIssues(parsed.error);
        } catch {
          problem = "the reply was not valid JSON";
        }

        if (attempt >= 1) {
          console.error("LLM output failed validation after repair:", problem);
          throw new AiError(502, "The AI returned an invalid analysis. Please try again.");
        }

        const repaired = await complete(
          [
            ...messages,
            { role: "assistant", content },
            { role: "user", content: `Your reply didn't match the required schema (${problem}). Reply again with only the corrected JSON object.` },
          ],
          request as JsonRequest<unknown>
        );
        content = repaired.content;
        model = repaired.model;
        usage.inputTokens += repaired.usage.inputTokens;
        usage.outputTokens += repaired.usage.outputTokens;
        usage.cachedInputTokens += repaired.usage.cachedInputTokens;
      }
    },

    async streamText(request: TextStreamRequest): Promise<AsyncIterable<string>> {
      const { res } = await post((m) => ({
        model: m,
        stream: true,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
        messages: [{ role: "system", content: request.system }, ...request.messages],
        ...reasoning(request.effort),
      }));
      if (!res.body) throw new AiError(502, "The AI service returned an empty response.");
      return parseSse(res.body);
    },
  };
};

// Server-sent events from a streaming chat completion → text deltas.
async function* parseSse(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finishReason: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      let chunk: { choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[] };
      try {
        chunk = JSON.parse(data);
      } catch {
        continue; // ignore keep-alives and malformed lines
      }
      const choice = chunk.choices?.[0];
      if (choice?.delta?.content) yield choice.delta.content;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    }
  }

  if (finishReason === "length") yield "\n\n_Answer truncated._";
  if (finishReason === "content_filter") yield "\n\n_The AI declined to answer this question._";
}
