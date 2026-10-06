// Provider selection, from env:
//   AI_PROVIDER         groq (default) | openrouter | gemini | openai | ollama | custom
//   AI_API_KEY          the provider's API key (not needed for ollama)
//   AI_MODEL            model id; required except for presets with a verified default
//   AI_BASE_URL         overrides the preset's endpoint (required for custom)
//   AI_FALLBACK_MODELS  comma-separated models to try when the primary is rate-limited or down
//   AI_JSON_MODE        json_schema | json_object (overrides the preset)
// All presets speak the OpenAI-compatible Chat Completions API.

export type JsonMode = "json_schema" | "json_object";

export interface LlmConfig {
  provider: string;
  baseUrl: string;
  apiKey: string | null;
  models: string[]; // primary first, then fallbacks
  jsonMode: JsonMode;
  // Whether to send `reasoning_effort` (only some providers/models accept it).
  supportsReasoningEffort: boolean;
}

interface Preset {
  baseUrl: string;
  defaultModel?: string;
  defaultFallbacks?: string[];
  jsonMode: JsonMode;
  supportsReasoningEffort: boolean;
  requiresKey: boolean;
}

export const PRESETS: Record<string, Preset> = {
  // Defaults verified against Groq's docs (2026-10): production models with free-tier limits
  // and strict json_schema support.
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    defaultFallbacks: ["openai/gpt-oss-20b"],
    jsonMode: "json_schema",
    supportsReasoningEffort: true,
    requiresKey: true,
  },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", jsonMode: "json_object", supportsReasoningEffort: false, requiresKey: true },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    jsonMode: "json_object",
    supportsReasoningEffort: false,
    requiresKey: true,
  },
  openai: { baseUrl: "https://api.openai.com/v1", jsonMode: "json_schema", supportsReasoningEffort: false, requiresKey: true },
  ollama: { baseUrl: "http://localhost:11434/v1", jsonMode: "json_object", supportsReasoningEffort: false, requiresKey: false },
  custom: { baseUrl: "", jsonMode: "json_object", supportsReasoningEffort: false, requiresKey: false },
};

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Returns null when AI isn't (fully) configured; the app then hides AI behind a friendly 503.
export const resolveLlmConfig = (env: Record<string, string | undefined> = process.env): LlmConfig | null => {
  const provider = (env.AI_PROVIDER ?? "groq").trim().toLowerCase();
  const preset = PRESETS[provider];
  if (!preset) {
    console.error(`Unknown AI_PROVIDER "${provider}". Expected one of: ${Object.keys(PRESETS).join(", ")}`);
    return null;
  }

  const apiKey = env.AI_API_KEY?.trim() || null;
  const baseUrl = (env.AI_BASE_URL?.trim() || preset.baseUrl).replace(/\/+$/, "");
  const model = env.AI_MODEL?.trim() || preset.defaultModel;
  if (!baseUrl || !model || (preset.requiresKey && !apiKey)) return null;

  const fallbacks = env.AI_FALLBACK_MODELS !== undefined ? list(env.AI_FALLBACK_MODELS) : (preset.defaultFallbacks ?? []);
  const jsonMode = env.AI_JSON_MODE === "json_schema" || env.AI_JSON_MODE === "json_object" ? env.AI_JSON_MODE : preset.jsonMode;

  return {
    provider,
    baseUrl,
    apiKey,
    models: [model, ...fallbacks.filter((m) => m !== model)],
    jsonMode,
    supportsReasoningEffort: preset.supportsReasoningEffort,
  };
};
