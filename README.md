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
- **Diagnostics**: page weight, requests, DOM size, main-thread time, heaviest third parties and a screenshot.
- **History and trends**: signed-in users can save runs and track their performance score over time.

## Architecture
```
Browser ──POST /api/analyze {url, strategy}──▶ Next.js route handler
                                                 ├─ zod request validation + URL normalization (blocks private hosts)
                                                 ├─ PageSpeed Insights API (timeout + 429 retry)
                                                 └─ transformPageSpeed() ──▶ Report (zod schema, src/lib/report.ts)
Dashboard components render the Report; "Save" stores a compact snapshot in Firestore.
```
`Report` in [`src/lib/report.ts`](src/lib/report.ts) is the single contract shared by the API, the UI and saved history.

## Getting started
Prerequisites: Node.js 20+.

```sh
npm install
cp .env.example .env.local   # then fill in the Firebase config and GOOGLE_PAGESPEED_API_KEY
npm run dev
```
Visit http://localhost:3000.

Get a PageSpeed key from the [Google Cloud console](https://console.cloud.google.com): enable
"PageSpeed Insights API", then create an API key under Credentials. The free quota is 25,000 requests/day.

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

`strategy` is `"mobile"` (default) or `"desktop"`. The response is a `Report`; see the schema in
[`src/lib/report.ts`](src/lib/report.ts). Errors come back as `{ "error": string }` with an HTTP status
(400 for invalid or unreachable URLs, 429 when rate-limited, 504 when the audit times out).

## License
MIT. Made by Rachita Pant.
