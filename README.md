# SitePulse — Web Performance Analyzer

Audit any public website and get a fix-first performance report: Lighthouse lab metrics,
real-user Core Web Vitals from the Chrome UX Report, failing audits ranked by estimated savings,
and an AI action plan in which every claim is checked against the measured data.

Built with **Next.js 16**, **React 19**, **TypeScript**, **zod** and **Firebase** (auth + history).
Analysis runs on the free **Google PageSpeed Insights API**, so everything deploys as one serverless
Next.js project on free tiers: no Chrome or backend server to host.

**Live:** [hardware-resource-usage-analyzer.vercel.app](https://hardware-resource-usage-analyzer.vercel.app) ·
**Video:** [LinkedIn demo](https://www.linkedin.com/posts/rachita-pant_webperformance-nextjs-lighthouse-activity-7317088421984772096-2-Wf?utm_source=share&utm_medium=member_desktop&rcm=ACoAADSI4QMBGNYYx9focleBnP4pRYzIq_iv6jQ)

- [Features](#features)
- [Setup guide](#setup-guide): [run locally](#1-run-it-locally-5-minutes) · [Google Cloud](#2-google-cloud-pagespeed-and-crux)
  · [Firebase](#3-firebase-sign-in-and-saved-history) · [AI](#4-ai-provider-optional-free) · [Vercel](#5-deploy-to-vercel)
  · [CI budgets](#6-performance-budgets-in-ci-optional) · [Upstash](#7-shared-cache-with-upstash-optional)
- [Environment variables](#environment-variables) · [Troubleshooting](#troubleshooting)
- [How it works](#how-it-works) · [How the AI layer stays honest](#how-the-ai-layer-stays-honest)
- [Scripts](#scripts) · [API](#api) · [Project structure](#project-structure)

## Features
- **Mobile or desktop audits** via PageSpeed Insights (Lighthouse 13), including very heavy pages.
- **Lab metrics**: LCP, TBT, CLS, FCP, Speed Index, and the four Lighthouse category scores.
- **Real-user data (CrUX)**: p75 LCP, **INP**, CLS, FCP and TTFB, plus a ~6-month weekly trend.
- **What to fix first**: failing Lighthouse insights ranked by estimated time and byte savings.
- **Security headers**: Mozilla HTTP Observatory grade (CSP, HSTS, etc.).
- **Diagnostics**: page weight, requests, DOM size, main-thread time, heaviest third parties, screenshot.
- **History**: signed-in users can save runs and track their performance score over time.
- **AI audit summary** and **Ask about this report** chat: every finding cites the measurements it relies on.
- **Performance budgets in CI**: a GitHub Action audits every Vercel deployment and comments on PRs.

---

## Setup guide

Each step after the first is optional; the app degrades gracefully and tells you what's missing.

| Step | Unlocks | Accounts needed | Cost |
| --- | --- | --- | --- |
| 1. Run locally | Audits | Google Cloud | Free |
| 2. Google Cloud (full) | Real-user trends; heavy pages in production | Google Cloud | Free |
| 3. Firebase | Sign-in, saved history, the dashboard | Firebase | Free (Spark plan) |
| 4. AI provider | AI summary and chat | Groq (or another) | Free tier |
| 5. Vercel | A public deployment | Vercel + GitHub | Free (Hobby) |
| 6. CI budgets | PR performance comments | GitHub | Free for public repos |
| 7. Upstash | Shared cache and rate limits across instances | Upstash | Free tier |

> The dashboard at `/dashboard` requires sign-in, so set up Firebase (step 3) to use the UI. Without it,
> the API (`POST /api/analyze`) still works, and sign-in shows "Sign-in isn't configured".

### 1. Run it locally (5 minutes)

**Prerequisites:** Node.js **20.9 or newer** (`node -v`) and npm.

```sh
git clone https://github.com/RachitaPant/Web-Performance-Analyzer.git
cd Web-Performance-Analyzer
npm install
cp .env.example .env.local
```

Get a Google API key (details in step 2): in the [Google Cloud console](https://console.cloud.google.com),
enable **PageSpeed Insights API**, create an API key, and put it in `.env.local`:

```sh
GOOGLE_PAGESPEED_API_KEY=your-key
```

```sh
npm run dev        # http://localhost:3000
npm test           # 100+ unit and render tests, no keys needed
```

Check the API without signing in:

```sh
curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"url":"example.com"}'
```

### 2. Google Cloud: PageSpeed and CrUX

All of these are free. PageSpeed Insights allows 25,000 requests per day.

1. Open the [Google Cloud console](https://console.cloud.google.com) and create (or pick) a project.
2. **APIs & Services → Library**: enable **PageSpeed Insights API** and **Chrome UX Report API**.
3. **APIs & Services → Credentials → Create credentials → API key.** This is the **server key**:
   - *API restrictions* → **Restrict key** → allow **PageSpeed Insights API** and **Chrome UX Report API**.
   - Leave *Application restrictions* as **None** (it's called from your server and CI, never a browser).
   - Put it in `GOOGLE_PAGESPEED_API_KEY`. Keep it secret.
4. **Recommended for production: a second, browser key.** Heavy pages can take PageSpeed 100+ seconds,
   longer than a serverless function may run. With a browser key, the user's browser calls PageSpeed
   directly and has no such limit. Create another API key:
   - *Application restrictions* → **Websites** → add `https://your-app.vercel.app/*`
     (and `http://localhost:3000/*` to use it in local development).
   - *API restrictions* → **Restrict key** → **PageSpeed Insights API** only.
   - Put it in `NEXT_PUBLIC_PSI_BROWSER_KEY`.

   This key ends up in the page's JavaScript, which is why it must be restricted: copied elsewhere,
   Google rejects it. Never use the server key here.

If the Chrome UX Report API isn't enabled, audits still work; the trend card explains what's missing.

### 3. Firebase: sign-in and saved history

1. Create a project in the [Firebase console](https://console.firebase.google.com) (the free Spark plan is enough).
2. **Project settings → General → Your apps → Add app → Web.** Copy the config values into `.env.local`:

   ```sh
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

   These values are public by design; your data is protected by the security rules below.
3. **Build → Authentication → Sign-in method**: enable **Email/Password** and **Anonymous**
   (Anonymous powers the "demo login" button).
4. **Authentication → Settings → Authorized domains**: once deployed, add your production domain
   (e.g. `your-app.vercel.app`) so Firebase Auth accepts requests from it.
5. **Build → Firestore Database → Create database** (production mode, any region).
6. **Firestore → Rules**: replace the rules with the contents of [`firestore.rules`](firestore.rules)
   and **Publish**. They let each user read and write only their own history. (With the Firebase CLI:
   `firebase deploy --only firestore:rules`.)
7. Check the config with `npm run test:firebase`, then restart `npm run dev`.

### 4. AI provider (optional, free)

The AI summary and chat work with any OpenAI-compatible provider. The default is **Groq**, which has a
free tier:

1. Create a key at [console.groq.com/keys](https://console.groq.com/keys).
2. In `.env.local`: `AI_API_KEY=your-groq-key`. That's all: `AI_PROVIDER` defaults to `groq` and the
   model to `openai/gpt-oss-120b`, falling back to `openai/gpt-oss-20b` when rate-limited.

Other providers are a config change:

| `AI_PROVIDER` | Also set | Notes |
| --- | --- | --- |
| `groq` (default) | – | Free tier, roughly 8K tokens/minute (about 2 AI calls per minute) |
| `openrouter` | `AI_MODEL` | Many models, including free ones |
| `gemini` | `AI_MODEL` | Google AI Studio key |
| `openai` | `AI_MODEL` | Paid |
| `ollama` | `AI_MODEL` | Local; no key; e.g. `AI_MODEL=llama3.2` |
| `custom` | `AI_MODEL`, `AI_BASE_URL` | Any OpenAI-compatible `/chat/completions` endpoint |

Measure quality on your provider with `npm run eval` (see [`evals/README.md`](evals/README.md)).
Without an AI key, the app works normally and the AI cards say AI isn't configured.

### 5. Deploy to Vercel

1. Push the repo to GitHub, then in [Vercel](https://vercel.com/new) **import** it (framework: Next.js,
   default build settings).
2. **Settings → Functions → enable Fluid Compute.** Required: `/api/analyze` asks for up to 180 seconds,
   and without Fluid Compute the Hobby plan caps functions at 60 seconds and **rejects the deployment**.
   (Projects created recently have it on by default.)
3. **Settings → Environment Variables**: add the variables you use (see [the table](#environment-variables)).
   - Tick **Production** and **Preview** for each.
   - Mark server-only keys (`GOOGLE_PAGESPEED_API_KEY`, `AI_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`) as
     **Sensitive**. `NEXT_PUBLIC_*` values are public, so marking them sensitive adds nothing.
4. **Deploy**, then:
   - add the production domain to the browser key's website restrictions (step 2.4);
   - add it to Firebase's authorized domains (step 3.4);
   - **redeploy** whenever you change a `NEXT_PUBLIC_*` variable, because those are baked in at build time.

Preview deployments are protected by Vercel login by default; that's fine for the app, but see step 6
if you want CI to audit them.

### 6. Performance budgets in CI (optional)

Every successful Vercel deployment triggers [`.github/workflows/sitepulse.yml`](.github/workflows/sitepulse.yml),
which runs [`scripts/sitepulse-ci.ts`](scripts/sitepulse-ci.ts) on GitHub's runner:

- audits the pages in [`.sitepulse/budget.json`](.sitepulse/budget.json) and checks your budgets, using
  the median of 3 independent Lighthouse runs per page (single runs vary widely: one page measured 99 and 69);
- for pull-request previews, compares against production and lists new or worse Lighthouse opportunities;
- when something broke or regressed, adds an AI explanation whose causes must cite real evidence;
- posts one PR comment (updated on each push), writes a job summary and a JSON artifact, and fails the
  check when a budget is exceeded. Regressions only warn by default, since lab scores vary.

**Setup** (GitHub repo → **Settings → Secrets and variables → Actions**):

| Name | Type | Value |
| --- | --- | --- |
| `GOOGLE_PAGESPEED_API_KEY` | Secret | Your **server** key (not the browser key) |
| `AI_API_KEY` | Secret | Optional; enables the AI explanation |
| `SITEPULSE_PRODUCTION_URL` | Variable | Baseline for PRs, e.g. `https://your-app.vercel.app` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Secret | Needed if previews are login-protected (the Vercel default) |
| `AI_PROVIDER`, `AI_MODEL` | Variables | Optional; only for a non-Groq provider |

For the bypass secret: Vercel → project → **Settings → Deployment Protection → Protection Bypass for
Automation** → generate, then paste it into the GitHub secret. It has to be sent to Google inside the
audited URL, so SitePulse strips it from every report, comment, artifact and log.

**Budgets:** edit [`.sitepulse/budget.json`](.sitepulse/budget.json):

```jsonc
{
  "runs": 3,                                   // Lighthouse runs per page (median is used)
  "pages": [{ "path": "/", "strategy": "mobile" }],
  "budgets": {                                 // all optional
    "performance": 90,                         // minimum score
    "lcpMs": 3500, "tbtMs": 300, "cls": 0.1,   // maximums
    "fcpMs": 2500, "totalBytes": 1000000
  },
  "regression": { "performancePoints": 5, "timingPercent": 20, "failOnRegression": false }
}
```

The comments above are for illustration; the real file is plain JSON. Set budgets from your own
numbers with some headroom: run
`npx tsx --env-file=.env.local scripts/sitepulse-ci.ts --url https://your-app.vercel.app` first.

### 7. Shared cache with Upstash (optional)

Reports are cached for an hour and audits are rate-limited per visitor. By default that state lives in
each serverless instance's memory. For a shared cache across instances, create a free database at
[upstash.com](https://upstash.com) and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
(Vercel's Upstash integration sets `KV_REST_API_URL`/`KV_REST_API_TOKEN`, which also work).

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` for local development; set the same names in Vercel.

| Variable | Needed for | Runs in | Notes |
| --- | --- | --- | --- |
| `GOOGLE_PAGESPEED_API_KEY` | Audits | Server, CI | **Required.** Secret. Needs PageSpeed + Chrome UX Report APIs |
| `NEXT_PUBLIC_PSI_BROWSER_KEY` | Heavy pages in production | Browser | Recommended. Referrer-restricted; redeploy after changing |
| `CRUX_API_KEY` | CrUX trends | Server | Optional; defaults to `GOOGLE_PAGESPEED_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Sign-in, history | Browser | Public by design; protected by Firestore rules |
| `AI_API_KEY` | AI summary and chat | Server, CI | Secret. Groq by default |
| `AI_PROVIDER` | AI | Server, CI | `groq` (default), `openrouter`, `gemini`, `openai`, `ollama`, `custom` |
| `AI_MODEL` | AI | Server, CI | Required except for `groq` |
| `AI_BASE_URL` | AI | Server, CI | Required for `custom` |
| `AI_FALLBACK_MODELS` | AI | Server, CI | Comma-separated models to try when the primary is rate-limited |
| `AI_JSON_MODE` | AI | Server, CI | `json_schema` or `json_object`; overrides the provider default |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared cache | Server | Optional; token is secret |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | CI on protected previews | CI only | GitHub secret, not a Vercel env var |
| `AI_PRICE_INPUT_PER_M`, `AI_PRICE_OUTPUT_PER_M` | Eval cost reporting | Local | Optional, USD per million tokens |

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Vercel build fails: *"invalid maxDuration … between 1 and 60 for plan hobby"* | Fluid Compute is off | Enable it (step 5.2) and redeploy |
| "This site took too long to analyze" on heavy sites | PageSpeed exceeded the server's time limit | Set `NEXT_PUBLIC_PSI_BROWSER_KEY` (step 2.4) and redeploy |
| Trend card: *"Chrome UX Report API isn't enabled"* | The server key can't call CrUX | Enable the API and allow it on the key (step 2.2–2.3) |
| Browser audits fail with `API_KEY_HTTP_REFERRER_BLOCKED` | Domain missing from the browser key | Add `https://your-domain/*` to its website restrictions |
| AI cards: *"AI features aren't configured"* | No `AI_API_KEY` (or `AI_MODEL` for non-Groq) | Step 4, then restart or redeploy |
| AI: *"The AI service is busy"* | Free-tier rate limit | Wait a minute; insights are cached per report |
| Sign-in: *"Sign-in isn't configured"* | Firebase vars missing | Step 3, then restart or redeploy |
| Saving history fails with a permissions error | Firestore rules not published | Publish [`firestore.rules`](firestore.rules) (step 3.6) |
| CI audits of previews return a login page or 401 | Vercel Deployment Protection | Add `VERCEL_AUTOMATION_BYPASS_SECRET` (step 6) |
| CI scores swing between runs | Lighthouse lab variance | Keep `runs` at 3 or more; widen budgets |

---

## How it works

```
Browser path (when NEXT_PUBLIC_PSI_BROWSER_KEY is set):
  browser ──▶ Google PageSpeed directly (no serverless time limit; heavy pages take 100 s+)
          ──▶ transformPageSpeed() in the browser
          ──POST /api/analyze/enrich {pagespeed}──▶ validate + add CrUX history & Observatory
          (client-supplied data is never written to the shared cache)

Server path (fallback, no browser key):
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
and saved history.

## How the AI layer stays honest
- **Any LLM provider.** The app depends on a two-method `LlmClient` interface
  ([`src/server/ai/llm.ts`](src/server/ai/llm.ts)) implemented once over the OpenAI-compatible
  Chat Completions API with plain `fetch` (no vendor SDK).
- **Evidence ids, not free text.** The report becomes a flat list of facts, each with an id such as
  `[lab:lcp]` ([`src/lib/evidence.ts`](src/lib/evidence.ts)). The model must cite ids for every finding.
- **Structured output and a grounding check.** Findings are validated against a zod schema (strict
  `json_schema` where supported, with one self-repair retry). Findings citing nothing, or an id that
  doesn't exist, are dropped before display ([`src/server/ai/grounding.ts`](src/server/ai/grounding.ts)).
- **Prompt-injection defense.** Report data is fenced in `<report_evidence>` and treated as untrusted.
- **Measured with evals.** `npm run eval` grades output on real reports for grounding, invented numbers,
  prioritization, fast-site restraint and injection resistance. On Groq `openai/gpt-oss-120b`:
  **24/24 checks and 100% grounding over two consecutive runs**, at $0
  ([`evals/README.md`](evals/README.md), including the bugs the eval caught).
- **Resilience and cost controls.** On-demand generation, 24 h insights cache, a separate AI rate limit,
  a 20-turn chat cap, and fallback models for rate limits.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (includes type-checking) |
| `npm test` | Unit and render tests (Jest; no keys or network needed) |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run test:firebase` | Check the Firebase config in `.env.local` |
| `npm run eval` | Grade the AI insights against real reports (calls the configured LLM) |
| `npm run perf:ci -- --url <url>` | Audit a deployment against `.sitepulse/budget.json` (what CI runs; needs env vars set) |

## API
`POST /api/analyze`

```json
{ "url": "example.com", "strategy": "mobile" }
```

`strategy` is `"mobile"` (default) or `"desktop"`; `refresh: true` skips the cache. The response is a
`Report` (see [`src/lib/report.ts`](src/lib/report.ts)) with an `X-Cache: HIT | MISS` header. Errors come back
as `{ "error": string }` with an HTTP status: 400 for invalid or unreachable URLs, 429 when rate-limited
(with `Retry-After` and `retryAfterSeconds`), 504 when the audit times out.

Also: `POST /api/analyze/enrich` (browser path), `POST /api/insights`, `POST /api/chat`.

## Project structure
```
src/app/            pages and API routes (analyze, analyze/enrich, insights, chat)
src/components/     dashboard UI
src/lib/            shared, isomorphic code: report schema, PageSpeed client and transform,
                    evidence, budgets, CI comment rendering
src/server/         server-only: data sources, cache, rate limits, AI (llm, providers, prompts, grounding)
scripts/            sitepulse-ci.ts (the CI runner)
evals/              AI eval cases, real report fixtures and runner
tests/              Jest tests and fixtures
.sitepulse/         performance budgets for CI
firestore.rules     Firestore security rules
```

## License
MIT. Made by Rachita Pant.
