# SitePulse — Web Performance Analyzer

Audit any public website and get a fix-first performance report: Lighthouse lab metrics,
real-user Core Web Vitals from the Chrome UX Report, and failing audits ranked by estimated savings.

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

For production, optionally add a free [Upstash Redis](https://upstash.com) database so the cache and rate
limit are shared across serverless instances (see `.env.example`).

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (includes type-checking) |
| `npm test` | Unit and render tests (Jest, using a real PSI response fixture) |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run test:firebase` | Check the Firebase config in `.env.local` |

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
