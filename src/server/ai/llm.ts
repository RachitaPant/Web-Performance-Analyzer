import type { z } from "zod";
import type { ChatTurn } from "@/lib/insights";
import { resolveLlmConfig } from "./config";
import { createOpenAiCompatibleClient } from "./providers/openaiCompatible";

// The app depends only on this interface. Providers are adapters behind it, selected by env
// (see ./config.ts), so switching Groq → OpenRouter → Ollama is a config change, not a code change.
export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

export type ReasoningEffort = "low" | "medium" | "high";

export interface JsonRequest<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  // Identifier used when the provider supports named JSON schemas.
  schemaName: string;
  effort?: ReasoningEffort;
}

export interface JsonResult<T> {
  data: T;
  // The model that actually answered (may be a fallback model).
  model: string;
  usage: LlmUsage;
}

export interface TextStreamRequest {
  system: string;
  messages: ChatTurn[];
  effort?: ReasoningEffort;
}

export interface LlmClient {
  readonly provider: string;
  readonly model: string;
  // Returns schema-validated JSON (the adapter repairs or rejects invalid output).
  generateJson<T>(request: JsonRequest<T>): Promise<JsonResult<T>>;
  // Opens the stream eagerly, so connection/auth/rate-limit errors throw before any text is yielded.
  streamText(request: TextStreamRequest): Promise<AsyncIterable<string>>;
}

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AiError";
  }
}

export const isAiConfigured = () => resolveLlmConfig() !== null;

let client: LlmClient | undefined;

export const getLlm = (): LlmClient => {
  const config = resolveLlmConfig();
  if (!config) throw new AiError(503, "AI features aren't configured on this deployment yet.");
  client ??= createOpenAiCompatibleClient(config);
  return client;
};

// Exposed for tests only: drops the cached client so env changes take effect.
export const __resetLlm = () => {
  client = undefined;
};
