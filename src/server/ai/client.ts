import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = "claude-opus-5-5";

// Server-side refusal fallback: if Opus 5.5's safety classifiers decline, the API re-runs the
// request on Anthropic's recommended fallback model instead of returning a refusal.
export const FALLBACK_PARAMS: Pick<Anthropic.Beta.Messages.MessageCreateParams, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AiError";
  }
}

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | undefined;

export const getAnthropic = (): Anthropic => {
  if (!isAiConfigured()) {
    throw new AiError(503, "AI features aren't configured on this deployment yet.");
  }
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });
  return client;
};

// Exposed for tests only: drops the cached client so each test gets a fresh one.
export const __resetAnthropicClient = () => {
  client = undefined;
};

// Maps SDK errors to user-facing messages; typed classes, most specific first.
export const toAiError = (error: unknown): AiError => {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.RateLimitError) {
    return new AiError(429, "The AI service is busy right now. Please try again in a minute.");
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    console.error("Anthropic auth error:", error.message);
    return new AiError(503, "AI features are misconfigured on this deployment.");
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Anthropic bad request:", error.message);
    return new AiError(500, "The AI request was rejected. Please try again.");
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AiError(504, "The AI took too long to respond. Please try again.");
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}:`, error.message);
    return new AiError(502, "The AI service had a problem. Please try again shortly.");
  }
  console.error("Unexpected AI error:", error);
  return new AiError(500, "Something went wrong generating AI insights.");
};
