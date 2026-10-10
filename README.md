# SitePulse — Web Performance Analyzer

Audit any public website and get a fix-first performance report: Lighthouse lab metrics,
real-user Core Web Vitals from the Chrome UX Report, failing audits ranked by estimated savings,
and an AI action plan in which every claim is checked against the measured data.

Built with **Next.js 16**, **React 19**, **TypeScript**, **zod** and **Firebase** (auth + history).
Analysis runs on the free **Google PageSpeed Insights API**, so the whole app deploys as a single
serverless Next.js project — no Chrome or heavy backend to host.

## See it in action
Video: [LinkedIn demo](https://www.linkedin.com/posts/rachita-pant_webperformance-nextjs-lighthouse-activity-7317088421984772096-2-Wf?utm_source=share&utm_medium=member_desktop&rcm=ACoAADSI4QMBGNYYx9focleBnP4pRYzIq_iv6jQ)

## Features
- **Mobile or desktop audits** via PageSpeed Insights (Lighthouse 13).
- **Lab metrics**: LCP, TBT, CLS, FCP, Speed Index, plus the four Lighthouse category scores.
- **Real-user data (CrUX)**: p75 LCP, **INP**, CLS, FCP and TTFB, at URL level with origin fallback.
- **What to fix first**: failing Lighthouse insights ranked by estimated time and byte savings.
- **Real-user trend**: ~6 months of weekly p75 LCP, INP and CLS from the CrUX History API.
- **Security headers**: Mozilla HTTP Observatory grade (CSP, HSTS, etc.).
- **Diagnostics**: page weight, requests, DOM size, main-thread time, heaviest third parties and a screenshot.
- **History and trends**: signed-in users can save runs and track their performance score over time.
- **Fast and quota-friendly**: reports are cached for an hour, and fresh audits are rate-limited per client.
- **AI audit summary**: prioritized findings with fixes, each citing the exact measurements it relies on.
- **Ask about this report**: a streaming chat grounded in the audit data.

## How the AI layer stays honest (and provider-agnostic)
- **Any LLM provider.** The app depends on a two-method `LlmClient` interface
  ([`src/server/ai/llm.ts`](src/server/ai/llm.ts)) implemented once over the OpenAI-compatible
  Chat Completions API with plain `fetch` (no vendor SDK). Groq (free tier, default), OpenRouter, Gemini,
  OpenAI, local Ollama or any compatible endpoint is a config change
  ([`src/server/ai/config.ts`](src/server/ai/config.ts)).
- **Evidence ids, not free text.** The report is turned into a flat list of facts, each with an id
  such as `[lab:lcp]` or `[opportunity:render-blocking-insight]`
  ([`src/lib/evidence.ts`](src/lib/evidence.ts)). The model must cite ids for every finding.
- **Structured output + grounding check.** Findings come back as JSON validated against a zod schema
  (strict `json_schema` where the provider supports it, `json_object` + schema-in-prompt elsewhere,
  with one self-repair retry on invalid output).
  Any finding that cites no evidence, or an id that doesn't exist, is dropped before display
  ([`src/server/ai/grounding.ts`](src/server/ai/grounding.ts)), and the UI says how many were removed.
- **Prompt-injection defense.** Report data is fenced in `<report_evidence>` in the user turn and
  treated as untrusted. The system prompt never contains report text.
- **Measured with evals.** `npm run eval` grades the output on real reports for grounding,
  invented numbers, prioritization, fast-site restraint and injection resistance. On Groq
  `openai/gpt-oss-120b`: **24/24 checks and 100% grounding over two consecutive runs**, at $0
  ([`evals/README.md`](evals/README.md), including the bugs the eval caught).
- **Resilience and cost controls.** Insights are generated on demand and cached per report for 24 h,
  AI calls have their own rate limit, chat is capped at 20 turns, and a rate-limited or failing model
  falls back to the next one in `AI_FALLBACK_MODELS`.

## Architecture
```
Browser ──POST /api/analyze {url, strategy, refresh?}──▶ Next.js route handler
  1. zod validation + URL normalization (blocks localhost / private hosts)
  2. report cache lookup ── hit ──▶ return (X-Cache: HIT, no quota used)
  3. per-client rate limit (sliding window)
  4. analyze(): sources fetched in parallel
       ├─ PageSpeed Insights  (required — failure fails the request)
       ├─ CrUX History API    (optional)
       └─ HTTP Observatory    (optional)
     optional sources never throw: each reports ok / unavailable / error in `report.sources`
  5. cache the Report, return it (X-Cache: MISS)

POST /api/insights {report}           ─▶ evidence ─▶ LLM (validated JSON) ─▶ grounding check ─▶ cache 24 h
POST /api/chat {report, messages}     ─▶ evidence in system prompt ─▶ LLM (streamed text)
```
`Report` in [`src/lib/report.ts`](src/lib/report.ts) is the single zod contract shared by the API, the UI
and saved history. Cache and rate-limit state live in Upstash Redis when configured, and in memory otherwise.

## Getting started
Prerequisites: Node.js 20+.

```sh
npm install
cp .env.example .env.local   # then fill in the Firebase config and GOOGLE_PAGESPEED_API_KEY
npm run dev
```
Visit http://localhost:3000.

Get a key from the [Google Cloud console](https://console.cloud.google.com): enable
**PageSpeed Insights API** and **Chrome UX Report API**, then create an API key under Credentials
(if you restrict the key, allow both APIs). The free PageSpeed quota is 25,000 requests/day.
Without the Chrome UX Report API the app still works; the trend card explains what's missing.

For the AI features, create a free [Groq API key](https://console.groq.com/keys) and set `AI_API_KEY`
(`AI_PROVIDER` defaults to `groq`). To use another provider, set `AI_PROVIDER`, `AI_MODEL` and, if
needed, `AI_BASE_URL` (see `.env.example`). Without a key the app works normally and the AI cards
explain that AI isn't configured.

For production, optionally add a free [Upstash Redis](https://upstash.com) database so the cache and rate
limit are shared across serverless instances (see `.env.example`).

## Deploying to Vercel
- Set the env vars from `.env.example` for **Production and Preview** (`GOOGLE_PAGESPEED_API_KEY`,
  `AI_API_KEY`, the `NEXT_PUBLIC_FIREBASE_*` values).
- Enable **Fluid Compute** (Project → Settings → Functions). Heavy pages can take Google PageSpeed
  100 s or more, and `/api/analyze` asks for 180 s; without Fluid Compute, Hobby caps functions at
  60 s and rejects the deployment. A test (`tests/routeConfig.test.ts`) guards these limits.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (includes type-checking) |
| `npm test` | Unit and render tests (Jest, using a real PSI response fixture) |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run test:firebase` | Check the Firebase config in `.env.local` |
| `npm run eval` | Grade the AI insights against real reports (calls the configured LLM) |

## API
`POST /api/analyze`

```json
{ "url": "example.com", "strategy": "mobile" }
```

`strategy` is `"mobile"` (default) or `"desktop"`; `refresh: true` skips the cache. The response is a
`Report` (see [`src/lib/report.ts`](src/lib/report.ts)) with an `X-Cache: HIT | MISS` header. Errors come back
as `{ "error": string }` with an HTTP status: 400 for invalid or unreachable URLs, 429 when rate-limited
(with `Retry-After` and `retryAfterSeconds`), 504 when the audit times out.

## License
MIT. Made by Rachita Pant.
