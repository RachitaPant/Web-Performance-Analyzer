# From LLM Wrapper to Production Pipeline — Roadmap

## 1. Where this actually stands today

A codebase audit turned up a gap between what the UI implies and what exists:

- `src/app/api/analyze/route.ts` is a thin proxy. It validates a URL and forwards it to `${NEXT_API_ENDPOINT}/analyze` — an external service **not present in this repo**. No Lighthouse, Puppeteer, or LLM call happens here.
- `lighthouse`, `puppeteer`, `chrome-launcher` are in `package.json` but unused by any source file — they only inform TypeScript interfaces (`PuppeteerData`, `LighthouseAudit`) describing data the missing backend is expected to return.
- **No LLM integration exists at all.** `components/AskAi/page.tsx` submits to `console.log(...)`. `PerformanceAdvice` is a display component with nowhere to source advice from.
- `@supabase/ssr` is an unused dependency; Firebase (Auth + Firestore client) is the only backend actually wired up, and only for auth — no analysis history is ever written.
- One test file, covering Firebase init only.

So "basic LLM wrapper" is generous — today it's a **UI shell with a dangling proxy to a service that doesn't exist in-repo**. That's actually a good position: there's no real analysis logic to migrate or break, so we're building the pipeline fresh rather than refactoring around a working one.

## 2. Product goal

A **stateless**, free-tier-only performance analysis platform that:
1. Aggregates every free signal available about a site/host's performance (lab, field, security, resource-cost) into one report.
2. Runs an LLM pass over the *aggregated, structured* data — not raw text — to produce prioritized, actionable recommendations, not generic advice.
3. Has no required server-side session/database — a request in, a report out. Auth + history in Firebase remain optional, additive persistence, never a load-bearing part of the analysis path.

## 3. Free data sources to combine

| Source | What it adds | Cost/limits | Auth |
|---|---|---|---|
| [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started) | Lab Lighthouse run + (where available) CrUX field data, Core Web Vitals | 25,000 req/day free with API key | API key (free) |
| [CrUX API](https://developer.chrome.com/docs/crux/api) | Real-user field data (LCP/INP/CLS/TTFB) direct, since PSI is dropping embedded field data | Free, generous quota | API key (free) |
| Self-run **Lighthouse** via `chrome-launcher`/`puppeteer-core` | Full control of run conditions (mobile/desktop emulation, throttling), avoids PSI queueing, gives you the raw audits already typed in this repo | Free (compute only) | none |
| [WebPageTest API](https://webpagetest.org) | Waterfall, filmstrip, multi-location/real-device testing | Free tier with API key, rate-limited | API key (free) |
| [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory) | Security header grade (CSP, HSTS, X-Frame-Options, etc.) with actionable fixes | Free, no key | none |
| [Qualys SSL Labs API](https://www.ssllabs.com/projects/ssllabs-apis/index.html) | TLS/cert grade, protocol/cipher issues | Free, but slow (full handshake test, cache results) | none |
| Node `systeminformation` package + `process`/`os` | **Local hardware-side signal**: CPU/mem/disk pressure of the analyzer host itself while a Puppeteer run executes — ties back to this repo's original "hardware resource allocation" angle by reporting the actual cost of analyzing a page, not just the page's own metrics | Free, local | none |
| Resource Timing / Server-Timing headers (fetched directly) | Byte-level breakdown of the target site's own responses (TTFB, transfer size, compression) as a cheap cross-check against Lighthouse | Free | none |

Design principle: **every one of these is optional and independently failable.** The pipeline degrades gracefully — if WebPageTest is rate-limited or SSL Labs is mid-scan, the report ships with what succeeded and flags what's missing, rather than failing the whole request.

## 4. Pipeline architecture (stateless)

```
POST /api/analyze  { url }
        │
        ▼
 ┌─────────────────────┐
 │ 1. Validate + normalize URL, dedupe key = sha256(url + ruleset version)
 └─────────────────────┘
        │
        ▼
 ┌───────────────────────────────────────────────────────────┐
 │ 2. Fan-out collectors (Promise.allSettled, per-collector    │
 │    timeout + circuit breaker)                               │
 │    - Lighthouse (self-run, headless Chrome)                 │
 │    - PSI API (mobile + desktop)                              │
 │    - CrUX API                                                │
 │    - HTTP Observatory                                        │
 │    - SSL Labs (async: kick off, poll with backoff, or        │
 │      degrade to "pending" if it won't finish in budget)      │
 │    - Raw fetch: headers, TTFB, payload size                  │
 │    - Host resource snapshot (systeminformation) during run   │
 └───────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ 3. Normalize → single ReportSchema (versioned, zod-validated)│
 └─────────────────────┘
        │
        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 4. LLM insight pass                                          │
 │    - Input: the normalized JSON (not raw HTML/HAR)            │
 │    - Structured output (JSON schema): { findings: [{severity, │
 │      category, evidence_ref, recommendation, est_impact}] }   │
 │    - Model routing: cheap/small model for the deterministic   │
 │      "what's the biggest LCP contributor" pass; escalate to   │
 │      a stronger model only for freeform trade-off questions   │
 │      (Ask AI feature)                                         │
 │    - Prompt-cache the fixed system prompt + rubric; only the  │
 │      per-request JSON varies                                  │
 └─────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ 5. Response: full report + insights, request-scoped only.    │
 │    Optional fire-and-forget write to Firestore for History,   │
 │    keyed to the authenticated user — never blocks the response│
 └─────────────────────┘
```

Statelessness is preserved because:
- Every collector call is idempotent and re-derivable from `(url, ruleset version)` — nothing depends on prior server memory.
- Caching (see §6) is an *acceleration* layer keyed by content hash, not session state — cold cache still produces a correct answer.
- Firestore write-back is history/audit only; deleting it doesn't change what `/api/analyze` returns for a fresh request.

## 5. Handling the parts that don't like being stateless

- **Headless Chrome on serverless (Vercel):** ship Puppeteer via `puppeteer-core` + `@sparticuz/chromium` (or `@sparticuz/chromium-min` to stay under the ~50MB function bundle limit), not the full `puppeteer` package. `next.config.ts` already needs `serverExternalPackages` for `lighthouse`/`chrome-launcher` — extend that list.
- **Runs that exceed function timeout (SSL Labs full scan can take 60–90s):** don't block the main response on it. Kick off the scan, return the rest of the report immediately with `ssl: { status: "pending", pollUrl }`, and let the client poll a second cheap endpoint (`GET /api/analyze/ssl?url=`) that re-queries SSL Labs' cached-by-them result. No server session needed — SSL Labs itself is the state holder.
- **Rate limits across free APIs:** an in-memory-per-invocation token count doesn't survive across serverless instances. Use a lightweight shared counter (Upstash Redis free tier, or Vercel KV free tier) purely for rate/circuit-breaker state — this is infrastructure state, not application/session state, and the app still works (just degrades a collector) if that store is unavailable.

## 6. Caching (cost + latency, not correctness)

- Cache full normalized reports by `sha256(url) + date-bucket(hour)` in Upstash Redis (free tier) or Vercel Data Cache. Re-analyzing the same URL within the bucket window returns instantly and burns zero LLM/API budget.
- Cache the LLM system prompt/rubric portion via native prompt caching on whichever provider is used (Anthropic prompt caching or OpenAI's automatic caching) — the rubric is identical across every request; only the per-URL JSON changes.
- Never cache per-user data (auth, history) in the same layer as public report caches.

## 7. LLM layer specifics

- Replace the dead `AskAi` stub with a real endpoint that takes the *already-generated* structured report as context (not the raw page), so answers stay grounded and cheap — no need to re-run collectors per question.
- Force structured JSON output for the automated "actionable insights" pass (function-calling / JSON schema mode) so the UI can render `MetricCard`/`PerformanceAdvice` deterministically instead of parsing prose.
- Add a deterministic pre-LLM ranking pass (plain code: sort audits by Lighthouse's own `numericValue`/weight) so the LLM's job is explaining and prioritizing already-ranked findings, not doing arithmetic — cheaper and more reliable.

## 8. Concrete work items, in order

1. **Kill the dangling proxy.** Replace `NEXT_API_ENDPOINT` forwarding in `route.ts` with real in-repo collectors (start with self-run Lighthouse + PSI, the two highest-value/lowest-effort sources).
2. **Define `ReportSchema`** (zod) as the one contract every collector normalizes into and every UI component + the LLM consumes. This directly reuses the `PuppeteerData`/`LighthouseAudit` shapes already assumed by `Charts`, `StatsCards`, `BottomStats`.
3. **Add collectors incrementally** behind the fan-out/circuit-breaker, in this order: Lighthouse (self-run) → PSI → HTTP Observatory → CrUX → raw header/TTFB fetch → SSL Labs (async) → host resource snapshot.
4. **Wire the LLM insight pass** with structured output, feeding off `ReportSchema`, replacing the `PerformanceAdvice` placeholder.
5. **Wire `AskAi`** to a real endpoint using the cached report as context.
6. **Add the cache layer** (Upstash/Vercel KV) once ≥2 collectors are live, not before — premature caching hides bugs in the normalization step.
7. **Firestore history write-back**, fire-and-forget, gated on `user` being present; `History` component already expects this shape.
8. **Remove the unused `@supabase/ssr` dependency** (or, if Supabase was intended to replace Firebase, decide that explicitly rather than carrying both).
9. **Tests:** contract tests per collector (mock the external HTTP calls, assert normalization), a golden-file test for `ReportSchema` validation, and an integration test hitting `/api/analyze` against a fixture site with all external calls mocked. Extend beyond the current Firebase-only test file.
10. **Observability:** structured logs per collector (success/timeout/error) so degraded reports are debuggable — since there's no session state, logs are the only place to see "why did SSL Labs not show up for this request."

## 9. Explicit non-goals (for now)

- No persistent job queue / worker fleet — free-tier serverless + `waitUntil`/polling covers the async cases (SSL Labs) without needing infrastructure beyond what's already free.
- No multi-tenant billing/quota system — out of scope until there's a reason to gate usage beyond the free API rate limits themselves.
- No self-hosted CrUX/WebPageTest — always call the public free APIs; running WebPageTest's agent infrastructure yourself defeats the "free resources" goal.
